import { Router } from "express";
import { prisma } from "../../../config/database.js";

import { CreateHotelService } from "../services/create-hotel.service.js";
import { ReadHotelService } from "../services/read-hotel.service.js";
import { UpdateHotelService } from "../services/update-hotel.service.js";

const router = Router();

const computeHorarioString = (horariosJson: any) => {
  if (!horariosJson || !Array.isArray(horariosJson)) return "";
  return horariosJson
    .map((entry: any) => {
      const dias = (entry.dias || "").trim();
      const ap = (entry.hora_apertura || "").trim();
      const ci = (entry.hora_cierre || "").trim();
      if (!dias && !ap && !ci) return "";
      if (ap && ci) return `${dias ? `${dias}: ` : ""}${ap} a ${ci}`;
      return `${dias}${ap || ci ? `: ${ap || ci}` : ""}`;
    })
    .filter(Boolean)
    .join("\n");
};

router.post("/hotel-register", async (req, res) => {
  try {
    const service = new CreateHotelService();
    const hotel = await service.execute(req.body);

    return res.status(201).json(hotel);
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

router.get("/hotels", async (req, res) => {
  try {
    const service = new ReadHotelService();
    // soporta filtros simples vía query params (opcional)
    const { nombre } = req.query;
    const filter: any = {};
    if (nombre) {
      filter.nombre = { contains: String(nombre), mode: 'insensitive' };
    }

    const result = await service.execute(filter);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/hotels/:id", async (req, res) => {
  try {
    const service = new ReadHotelService();
    const result = await service.findOne(req.params.id);
    if (!result.success) return res.status(404).json({ success: false, message: 'Hotel no encontrado' });
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/hotels/:id", async (req, res) => {
  try {
    const service = new UpdateHotelService();
    const result = await service.execute(req.params.id, req.body);
    return res.json(result);
  } catch (err: any) {
    const status = err.message === 'Hotel no encontrado' ? 404 : 400;
    return res.status(status).json({ success: false, message: err.message });
  }
});

// GET /sitios-cercanos — lista todos los sitios cercanos (para selectores en formularios)
router.get("/sitios-cercanos", async (req, res) => {
  try {
    const { categoria, hotel_id } = req.query;
    const where: any = {};
    if (categoria) where.categoria = String(categoria);
    if (hotel_id) where.hotel_id = String(hotel_id);

    const sitios = await (prisma as any).sitio_cercano.findMany({
      where,
      include: {
        evento_local: {
          orderBy: { fecha_inicio: "asc" },
        },
      },
      orderBy: { nombre: "asc" },
    });
    return res.json({ success: true, data: sitios });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/sitios-cercanos", async (req, res) => {
  try {
    const { 
      nombre, categoria, direccion, latitud, longitud, 
      distancia_km, tiempo_estimado_minutos, telefono, 
      sitio_web, horario, descripcion,
      servicios, redes_sociales, link_maps,
      especificaciones, correo_contacto, calificacion,
      imagen_url, evento_local, horarios_json
    } = req.body;

    // Validaciones de rangos numéricos para evitar desbordamiento (numeric field overflow)
    if (latitud === undefined || latitud === "") {
      return res.status(400).json({ success: false, message: "La latitud es requerida." });
    }
    const cleanLat = typeof latitud === "string" ? latitud.replace(",", ".") : latitud;
    const lat = Number(cleanLat);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      return res.status(400).json({ success: false, message: "La latitud debe ser un número decimal válido entre -90 y 90 (ej. 21.1578)." });
    }

    if (longitud === undefined || longitud === "") {
      return res.status(400).json({ success: false, message: "La longitud es requerida." });
    }
    const cleanLng = typeof longitud === "string" ? longitud.replace(",", ".") : longitud;
    const lng = Number(cleanLng);
    if (isNaN(lng) || lng < -180 || lng > 180) {
      return res.status(400).json({ success: false, message: "La longitud debe ser un número decimal válido entre -180 y 180 (ej. -100.9312)." });
    }

    let dist: number | null = null;
    if (distancia_km !== undefined && distancia_km !== "" && distancia_km !== null) {
      const cleanDist = typeof distancia_km === "string" ? distancia_km.replace(",", ".") : distancia_km;
      const parsedDist = Number(cleanDist);
      if (isNaN(parsedDist) || parsedDist < 0 || parsedDist > 9999.99) {
        return res.status(400).json({ success: false, message: "La distancia en KM debe ser un número positivo entre 0 y 9999.99." });
      }
      dist = parsedDist;
    }

    if (calificacion !== undefined && calificacion !== "" && calificacion !== null) {
      const cal = Number(calificacion);
      if (isNaN(cal) || cal < 1 || cal > 5) {
        return res.status(400).json({ success: false, message: "La calificación debe ser un número entre 1 y 5." });
      }
    }
    
    // Obtener hotel por defecto
    const hotel = await (prisma as any).hotel.findFirst();
    if (!hotel) return res.status(400).json({ success: false, message: "No hay hoteles registrados" });

    let finalHorario = horario;
    if (horarios_json && Array.isArray(horarios_json)) {
      finalHorario = computeHorarioString(horarios_json);
    }

    const sitio = await (prisma as any).sitio_cercano.create({
      data: {
        hotel_id: hotel.id,
        nombre: nombre ? String(nombre).substring(0, 150) : "Sitio",
        categoria: categoria ? String(categoria).substring(0, 50) : "General",
        direccion,
        latitud: lat,
        longitud: lng,
        distancia_km: dist,
        tiempo_estimado_minutos: tiempo_estimado_minutos ? Number(tiempo_estimado_minutos) : null,
        telefono: telefono ? String(telefono).substring(0, 20) : null,
        sitio_web: sitio_web ? String(sitio_web).substring(0, 200) : null,
        horario: finalHorario,
        horarios_json: horarios_json || null,
        descripcion,
        servicios,
        redes_sociales,
        link_maps,
        especificaciones,
        correo_contacto: correo_contacto ? String(correo_contacto).substring(0, 150) : null,
        calificacion: calificacion ? Number(calificacion) : null,
        imagen_url: imagen_url ? String(imagen_url) : null,
        evento_local: Array.isArray(evento_local) && evento_local.length > 0 ? {
          create: evento_local.map((ev: any) => ({
            nombre: ev.nombre ? String(ev.nombre).substring(0, 150) : "Evento",
            fecha_inicio: ev.fecha_inicio ? new Date(ev.fecha_inicio) : null,
            fecha_fin: ev.fecha_fin ? new Date(ev.fecha_fin) : null,
            mes_referencia: ev.mes_referencia ? String(ev.mes_referencia).substring(0, 20) : null,
            descripcion: ev.descripcion
          }))
        } : undefined
      }
    });
    return res.status(201).json({ success: true, data: sitio });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/sitios-cercanos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      nombre, categoria, direccion, latitud, longitud, 
      distancia_km, tiempo_estimado_minutos, telefono, 
      sitio_web, horario, descripcion,
      servicios, redes_sociales, link_maps,
      especificaciones, correo_contacto, calificacion,
      imagen_url, evento_local, horarios_json
    } = req.body;

    // Validaciones de rangos numéricos para evitar desbordamiento (numeric field overflow)
    let parsedLat: number | undefined = undefined;
    if (latitud !== undefined && latitud !== "" && latitud !== null) {
      const cleanLat = typeof latitud === "string" ? latitud.replace(",", ".") : latitud;
      parsedLat = Number(cleanLat);
      if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
        return res.status(400).json({ success: false, message: "La latitud debe ser un número decimal válido entre -90 y 90 (ej. 21.1578)." });
      }
    }

    let parsedLng: number | undefined = undefined;
    if (longitud !== undefined && longitud !== "" && longitud !== null) {
      const cleanLng = typeof longitud === "string" ? longitud.replace(",", ".") : longitud;
      parsedLng = Number(cleanLng);
      if (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) {
        return res.status(400).json({ success: false, message: "La longitud debe ser un número decimal válido entre -180 y 180 (ej. -100.9312)." });
      }
    }

    let parsedDist: number | null | undefined = undefined;
    if (distancia_km !== undefined && distancia_km !== "" && distancia_km !== null) {
      const cleanDist = typeof distancia_km === "string" ? distancia_km.replace(",", ".") : distancia_km;
      parsedDist = Number(cleanDist);
      if (isNaN(parsedDist) || parsedDist < 0 || parsedDist > 9999.99) {
        return res.status(400).json({ success: false, message: "La distancia en KM debe ser un número positivo entre 0 y 9999.99." });
      }
    } else if (distancia_km === null || distancia_km === "") {
      parsedDist = null;
    }

    let parsedCal: number | null | undefined = undefined;
    if (calificacion !== undefined && calificacion !== "" && calificacion !== null) {
      const cal = Number(calificacion);
      if (isNaN(cal) || cal < 1 || cal > 5) {
        return res.status(400).json({ success: false, message: "La calificación debe ser un número entre 1 y 5." });
      }
      parsedCal = cal;
    } else if (calificacion === null || calificacion === "") {
      parsedCal = null;
    }

    // Sincronizar eventos locales eliminando los anteriores y re-creando el nuevo set
    if (evento_local !== undefined && Array.isArray(evento_local)) {
      await (prisma as any).evento_local.deleteMany({
        where: { sitio_cercano_id: id }
      });
    }

    let finalHorario = horario;
    if (horarios_json && Array.isArray(horarios_json)) {
      finalHorario = computeHorarioString(horarios_json);
    }

    const sitio = await (prisma as any).sitio_cercano.update({
      where: { id },
      data: {
        nombre: nombre ? String(nombre).substring(0, 150) : undefined,
        categoria: categoria ? String(categoria).substring(0, 50) : undefined,
        direccion,
        latitud: parsedLat,
        longitud: parsedLng,
        distancia_km: parsedDist,
        tiempo_estimado_minutos: tiempo_estimado_minutos !== undefined && tiempo_estimado_minutos !== "" ? Number(tiempo_estimado_minutos) : (tiempo_estimado_minutos === null || tiempo_estimado_minutos === "" ? null : undefined),
        telefono: telefono !== undefined ? (telefono ? String(telefono).substring(0, 20) : null) : undefined,
        sitio_web: sitio_web !== undefined ? (sitio_web ? String(sitio_web).substring(0, 200) : null) : undefined,
        horario: finalHorario !== undefined ? finalHorario : undefined,
        horarios_json: horarios_json !== undefined ? (horarios_json || null) : undefined,
        descripcion,
        servicios,
        redes_sociales,
        link_maps,
        especificaciones,
        correo_contacto: correo_contacto !== undefined ? (correo_contacto ? String(correo_contacto).substring(0, 150) : null) : undefined,
        calificacion: parsedCal,
        imagen_url: imagen_url !== undefined ? (imagen_url ? String(imagen_url) : null) : undefined,
        evento_local: Array.isArray(evento_local) ? {
          create: evento_local.map((ev: any) => ({
            nombre: ev.nombre ? String(ev.nombre).substring(0, 150) : "Evento",
            fecha_inicio: ev.fecha_inicio ? new Date(ev.fecha_inicio) : null,
            fecha_fin: ev.fecha_fin ? new Date(ev.fecha_fin) : null,
            mes_referencia: ev.mes_referencia ? String(ev.mes_referencia).substring(0, 20) : null,
            descripcion: ev.descripcion
          }))
        } : undefined
      }
    });
    return res.json({ success: true, data: sitio });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.delete("/sitios-cercanos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await (prisma as any).sitio_cercano.delete({ where: { id } });
    return res.json({ success: true, message: "Sitio eliminado correctamente" });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── CRUD EVENTOS LOCALES DE TEMPORADA ───

// GET /eventos-locales
router.get("/eventos-locales", async (req, res) => {
  try {
    const eventos = await (prisma as any).evento_local.findMany({
      include: { sitio_cercano: true },
      orderBy: { fecha_inicio: "asc" }
    });
    return res.json({ success: true, data: eventos });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /eventos-locales
router.post("/eventos-locales", async (req, res) => {
  try {
    const { nombre, fecha_inicio, fecha_fin, mes_referencia, descripcion, sitio_cercano_id, horarios_json } = req.body;
    const evento = await (prisma as any).evento_local.create({
      data: {
        nombre: nombre ? String(nombre).substring(0, 150) : "Evento",
        fecha_inicio: fecha_inicio ? new Date(fecha_inicio) : null,
        fecha_fin: fecha_fin ? new Date(fecha_fin) : null,
        mes_referencia: mes_referencia ? String(mes_referencia).substring(0, 20) : null,
        descripcion,
        sitio_cercano_id: sitio_cercano_id || null,
        horarios_json: horarios_json || null
      }
    });
    return res.status(201).json({ success: true, data: evento });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /eventos-locales/:id
router.put("/eventos-locales/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, fecha_inicio, fecha_fin, mes_referencia, descripcion, sitio_cercano_id, horarios_json } = req.body;
    const evento = await (prisma as any).evento_local.update({
      where: { id },
      data: {
        nombre: nombre ? String(nombre).substring(0, 150) : undefined,
        fecha_inicio: fecha_inicio !== undefined ? (fecha_inicio ? new Date(fecha_inicio) : null) : undefined,
        fecha_fin: fecha_fin !== undefined ? (fecha_fin ? new Date(fecha_fin) : null) : undefined,
        mes_referencia: mes_referencia !== undefined ? (mes_referencia ? String(mes_referencia).substring(0, 20) : null) : undefined,
        descripcion,
        sitio_cercano_id: sitio_cercano_id !== undefined ? (sitio_cercano_id || null) : undefined,
        horarios_json: horarios_json !== undefined ? (horarios_json || null) : undefined
      }
    });
    return res.json({ success: true, data: evento });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /eventos-locales/:id
router.delete("/eventos-locales/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await (prisma as any).evento_local.delete({ where: { id } });
    return res.json({ success: true, message: "Evento eliminado correctamente" });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

