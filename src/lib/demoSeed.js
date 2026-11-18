// Datos de ejemplo solo para el modo DEMO (sin Supabase). Reemplázalos desde el admin.
export function demoSeed() {
  const cat = (id, name, sort_order) => ({ id, name, sort_order })
  const svc = (id, category_id, name, price, duration_min, description, extra = {}) =>
    ({ id, category_id, name, price, duration_min, description, image_url: null, featured: false, price_from: false, active: true, sort_order: 0, ...extra })
  return {
    settings: {
      id: 1,
      salon_name: 'Studio Angelica',
      tagline: 'Belleza con intención. Cuidado con exclusividad.',
      logo_url: '/logo-studio-angelica.png', hero_url: null,
      about: 'Un espacio pensado para que te desconectes. Cada tratamiento se adapta a tu piel, tu cabello y tu tiempo.',
      address: 'Ciudad de Panamá',
      maps_query: 'Ciudad de Panamá',
      phone: '+507 6000-0000', whatsapp: '50760000000', instagram: 'tuusuario',
      slot_minutes: 30, min_notice_hours: 2, max_days_ahead: 60,
      policies: [
        'No se aceptan acompañantes.',
        'Acude sin maquillaje para no alterar el tiempo de tu cita.',
        'Si existe alguna condición de salud o necesidad específica, infórmala al reservar.',
        'Tolerancia máxima de 15 minutos. Si se excede, la cita podrá reprogramarse.',
        'Para reprogramar, avísanos con al menos 48 horas de anticipación, sujeto a disponibilidad.',
        'Tu cita queda confirmada cuando te escribimos por WhatsApp.'
      ],
      promo_title: 'Cortesía de diciembre',
      promo_items: ['Detalle especial en tu servicio', 'Descuento en tu próxima cita', 'Coffee break: café frío, café negro o ponche']
    },
    categories: [cat('c1', 'Faciales', 1), cat('c2', 'Cejas y pestañas', 2), cat('c3', 'Manos y pies', 3), cat('c4', 'Cabello', 4)],
    services: [
      svc('s1', 'c1', 'Limpieza facial profunda', 45, 60, 'Extracción, exfoliación y mascarilla según tu tipo de piel.', { featured: true }),
      svc('s2', 'c1', 'Hidrafacial', 85, 75, 'Limpieza, exfoliación e hidratación intensiva en una sola sesión.'),
      svc('s3', 'c2', 'Diseño de cejas', 15, 30, 'Visagismo y depilación con hilo o pinza.'),
      svc('s4', 'c2', 'Lifting de pestañas', 40, 60, 'Curvatura natural de cuatro a seis semanas.', { featured: true }),
      svc('s5', 'c3', 'Manicure semipermanente', 25, 60, 'Esmaltado de larga duración con cuidado de cutícula.'),
      svc('s6', 'c3', 'Pedicure spa', 35, 75, 'Exfoliación, hidratación y esmaltado.'),
      svc('s7', 'c4', 'Blower', 20, 45, 'Lavado y secado con cepillo.', { price_from: true }),
      svc('s8', 'c4', 'Tinte completo', 70, 120, 'Color de raíz a puntas. El precio final depende del largo.', { price_from: true })
    ],
    gallery: [],
    hours: [
      { weekday: 0, is_open: false, open_time: '09:00', close_time: '14:00' },
      { weekday: 1, is_open: true, open_time: '09:00', close_time: '18:00' },
      { weekday: 2, is_open: true, open_time: '09:00', close_time: '18:00' },
      { weekday: 3, is_open: true, open_time: '09:00', close_time: '18:00' },
      { weekday: 4, is_open: true, open_time: '09:00', close_time: '18:00' },
      { weekday: 5, is_open: true, open_time: '09:00', close_time: '18:00' },
      { weekday: 6, is_open: true, open_time: '09:00', close_time: '15:00' }
    ],
    blocked: [{ day: '2026-12-25', reason: 'Navidad' }, { day: '2027-01-01', reason: 'Año Nuevo' }],
    appointments: []
  }
}
