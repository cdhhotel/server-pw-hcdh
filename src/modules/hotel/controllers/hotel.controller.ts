import { Router } from "express";
import { prisma } from "../../../config/database.js";
import { uploadItineraryImages } from "../../../middlewares/upload.middleware.js";

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

router.post("/sitios-cercanos", uploadItineraryImages.single("imagenFile"), async (req, res) => {
  try {
    const { 
      nombre, categoria, direccion, latitud, longitud, 
      distancia_km, tiempo_estimado_minutos, telefono, 
      sitio_web, horario, descripcion,
      servicios, redes_sociales, link_maps,
      especificaciones, correo_contacto, calificacion
    } = req.body;

    let { imagen_url, evento_local, horarios_json } = req.body;

    if (typeof evento_local === "string") {
      try { evento_local = JSON.parse(evento_local); } catch (e) {}
    }
    if (typeof horarios_json === "string") {
      try { horarios_json = JSON.parse(horarios_json); } catch (e) {}
    }
    if (req.file && (!imagen_url || !String(imagen_url).startsWith("data:image/"))) {
      imagen_url = `/uploads/itinerary/${req.file.filename}`;
    }

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

router.put("/sitios-cercanos/:id", uploadItineraryImages.single("imagenFile"), async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      nombre, categoria, direccion, latitud, longitud, 
      distancia_km, tiempo_estimado_minutos, telefono, 
      sitio_web, horario, descripcion,
      servicios, redes_sociales, link_maps,
      especificaciones, correo_contacto, calificacion
    } = req.body;

    let { imagen_url, evento_local, horarios_json } = req.body;

    if (typeof evento_local === "string") {
      try { evento_local = JSON.parse(evento_local); } catch (e) {}
    }
    if (typeof horarios_json === "string") {
      try { horarios_json = JSON.parse(horarios_json); } catch (e) {}
    }
    if (req.file && (!imagen_url || !String(imagen_url).startsWith("data:image/"))) {
      imagen_url = `/uploads/itinerary/${req.file.filename}`;
    }

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
router.post("/eventos-locales", uploadItineraryImages.single("imagenFile"), async (req, res) => {
  console.log("POST /eventos-locales");
  console.log("Content-Type:", req.headers["content-type"]);
  console.log("req.body:", req.body);
  console.log("req.file:", req.file);
  try {
    if (!req.body) {
      return res.status(400).json({ success: false, message: "req.body is undefined. Content-Type: " + req.headers["content-type"] });
    }
    const { nombre, fecha_inicio, fecha_fin, mes_referencia, descripcion, sitio_cercano_id, link_maps, latitud, longitud } = req.body;
    let { horarios_json, imagen_url } = req.body;

    if (typeof horarios_json === "string") {
      try { horarios_json = JSON.parse(horarios_json); } catch (e) {}
    }
    if (req.file && (!imagen_url || !String(imagen_url).startsWith("data:image/"))) {
      imagen_url = `/uploads/itinerary/${req.file.filename}`;
    }

    const evento = await (prisma as any).evento_local.create({
      data: {
        nombre: nombre ? String(nombre).substring(0, 150) : "Evento",
        fecha_inicio: fecha_inicio ? new Date(fecha_inicio) : null,
        fecha_fin: fecha_fin ? new Date(fecha_fin) : null,
        mes_referencia: mes_referencia ? String(mes_referencia).substring(0, 20) : null,
        descripcion,
        sitio_cercano_id: sitio_cercano_id || null,
        horarios_json: horarios_json || null,
        imagen_url: imagen_url ? String(imagen_url) : null,
        link_maps: link_maps ? String(link_maps) : null,
        latitud: latitud ? Number(latitud) : null,
        longitud: longitud ? Number(longitud) : null
      }
    });
    return res.status(201).json({ success: true, data: evento });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /eventos-locales/:id
router.put("/eventos-locales/:id", uploadItineraryImages.single("imagenFile"), async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, fecha_inicio, fecha_fin, mes_referencia, descripcion, sitio_cercano_id, link_maps, latitud, longitud } = req.body;
    let { horarios_json, imagen_url } = req.body;

    if (typeof horarios_json === "string") {
      try { horarios_json = JSON.parse(horarios_json); } catch (e) {}
    }
    if (req.file && (!imagen_url || !String(imagen_url).startsWith("data:image/"))) {
      imagen_url = `/uploads/itinerary/${req.file.filename}`;
    }

    const evento = await (prisma as any).evento_local.update({
      where: { id },
      data: {
        nombre: nombre ? String(nombre).substring(0, 150) : undefined,
        fecha_inicio: fecha_inicio !== undefined ? (fecha_inicio ? new Date(fecha_inicio) : null) : undefined,
        fecha_fin: fecha_fin !== undefined ? (fecha_fin ? new Date(fecha_fin) : null) : undefined,
        mes_referencia: mes_referencia !== undefined ? (mes_referencia ? String(mes_referencia).substring(0, 20) : null) : undefined,
        descripcion,
        sitio_cercano_id: sitio_cercano_id !== undefined ? (sitio_cercano_id || null) : undefined,
        horarios_json: horarios_json !== undefined ? (horarios_json || null) : undefined,
        imagen_url: imagen_url !== undefined ? (imagen_url ? String(imagen_url) : null) : undefined,
        link_maps: link_maps !== undefined ? (link_maps ? String(link_maps) : null) : undefined,
        latitud: latitud !== undefined ? (latitud ? Number(latitud) : null) : undefined,
        longitud: longitud !== undefined ? (longitud ? Number(longitud) : null) : undefined
      }
    });
    return res.json({ success: true, data: evento });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Cache temporal en memoria de la calificación de Airbnb
let airbnbCacheData = {
  rating: 4.77,
  maxRating: 5.0,
  totalReviews: 13,
  listingTitle: "Casa Dolores Hidalgo, hab 9",
  listingUrl: "https://www.airbnb.mx/rooms/1245181293769210016?check_in=2026-09-08&check_out=2026-09-09",
  categoryRatings: [
    { label: "Limpieza", score: 4.5 },
    { label: "Veracidad", score: 4.6 },
    { label: "Llegada", score: 4.8 },
    { label: "Comunicación", score: 4.8 },
    { label: "Ubicación", score: 5.0 },
    { label: "Calidad-precio", score: 4.8 }
  ],
  lastUpdated: new Date().toISOString()
};

async function fetchLiveAirbnbData(listingUrl: string) {
  try {
    const res = await fetch(listingUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "es-MX,es;q=0.9,en-US;q=0.8,en;q=0.7"
      }
    });

    if (!res.ok) return null;
    const html = await res.text();

    let rating: number | null = null;
    let reviewCount: number | null = null;

    const ogMatch = html.match(/([0-9]+\.[0-9]+)\s*·\s*([0-9]+)\s*(evaluac|reseña|review)/i);
    if (ogMatch) {
      rating = parseFloat(ogMatch[1]);
      reviewCount = parseInt(ogMatch[2], 10);
    }

    if (!rating) {
      const ratingMatch = html.match(/"ratingValue"\s*:\s*"?([0-9\.]+)"?/i) || html.match(/"rating"\s*:\s*([0-9\.]+)/i);
      if (ratingMatch) rating = parseFloat(ratingMatch[1]);
    }
    if (!reviewCount) {
      const reviewMatch = html.match(/"reviewCount"\s*:\s*"?([0-9]+)"?/i);
      if (reviewMatch) reviewCount = parseInt(reviewMatch[1], 10);
    }

    if (rating && !isNaN(rating) && rating > 0 && rating <= 5) {
      return {
        rating,
        totalReviews: reviewCount && !isNaN(reviewCount) ? reviewCount : airbnbCacheData.totalReviews
      };
    }
  } catch (err) {
    console.error("[AirbnbFetchError]", err);
  }
  return null;
}

// GET /hotel/airbnb-rating — Obtiene la calificación actual de Airbnb
router.get("/airbnb-rating", async (req, res) => {
  try {
    const { forceRefresh } = req.query;
    const now = new Date().getTime();
    const lastCheck = new Date(airbnbCacheData.lastUpdated).getTime();
    const isStale = (now - lastCheck) > 4 * 60 * 60 * 1000; // 4 horas

    if (forceRefresh === "true" || isStale) {
      const live = await fetchLiveAirbnbData(airbnbCacheData.listingUrl);
      if (live) {
        airbnbCacheData.rating = live.rating;
        airbnbCacheData.totalReviews = live.totalReviews;
        airbnbCacheData.lastUpdated = new Date().toISOString();
      }
    }

    return res.json({ success: true, data: airbnbCacheData });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /hotel/airbnb-rating — Permite actualizar manualmente la calificación
router.put("/airbnb-rating", async (req, res) => {
  try {
    const { rating, totalReviews, listingTitle, listingUrl, categoryRatings } = req.body;
    if (rating !== undefined) airbnbCacheData.rating = Number(rating);
    if (totalReviews !== undefined) airbnbCacheData.totalReviews = Number(totalReviews);
    if (listingTitle !== undefined) airbnbCacheData.listingTitle = String(listingTitle);
    if (listingUrl !== undefined) airbnbCacheData.listingUrl = String(listingUrl);
    if (Array.isArray(categoryRatings)) airbnbCacheData.categoryRatings = categoryRatings;
    airbnbCacheData.lastUpdated = new Date().toISOString();

    return res.json({ success: true, message: "Calificación de Airbnb actualizada correctamente", data: airbnbCacheData });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

export default router;


