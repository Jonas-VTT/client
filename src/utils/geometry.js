export const rectsHaveIntersection = (r1, r2) => {
   return !(
      r2.x > r1.x + r1.width ||
      r2.x + r2.width < r1.x ||
      r2.y > r1.y + r1.height ||
      r2.y + r2.height < r1.y
   )
}
export const getRayIntersection = (ray, segment) => {
   const r_px = ray.x;
   const r_py = ray.y;
   const r_dx = ray.dx;
   const r_dy = ray.dy;

   const s_px = segment.a.x;
   const s_py = segment.a.y;
   const s_dx = segment.b.x - segment.a.x;
   const s_dy = segment.b.y - segment.a.y;

   // 1. Calcula o Determinante (Evita divisão por zero)
   const denominator = (s_dy * r_dx) - (s_dx * r_dy);

   if (denominator === 0) return null; // Linhas paralelas

   const dist_x = r_px - s_px;
   const dist_y = r_py - s_py;

   const T1 = ((s_dx * dist_y) - (s_dy * dist_x)) / denominator;
   const T2 = ((r_dx * dist_y) - (r_dy * dist_x)) / denominator;

   if (T1 > 0 && T2 >= 0 && T2 <= 1) {
      return {
         x: r_px + (r_dx * T1),
         y: r_py + (r_dy * T1),
         param: T1
      };
   }

   return null;
};

export const getDistance = (p1, p2) => {
   return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
}
export const getAngleDegrees = (p1, p2) => {
   return Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI)
}