// Per-theme settings for the glass cat. Dark: a black studio with coloured
// light strips, so the facets glint. Light: a pale studio with dark flags,
// so the edges read as smoked glass instead of washing out.

export const LOOKS = {
  dark: {
    bg: '#0b0c0e',
    // backdrop halo the glass refracts: cool upper-left, warm lower-right
    haloA: '#4c7290',
    haloB: '#7d6c5c',
    haloStrength: 0.7,
    haloFalloff: 4.4,
    bandStrength: 0,
    shadowStrength: 0,
    envIntensity: 1.3,
    key: 5,
    rim: 3,
    glass: {
      color: '#ffffff',
      attenuationColor: '#dcecf7',
      attenuationDistance: 6,
      thickness: 0.6,
      roughness: 0.04,
      ior: 1.45,
      iridescence: 1,
      iridescenceIOR: 1.3,
      iridescenceThicknessMinimum: 260,
      iridescenceThicknessMaximum: 460,
      dispersion: 2.5,
      specularIntensity: 1,
    },
  },
  light: {
    bg: '#eceef1',
    haloA: '#b9d3e2',
    haloB: '#ecd5bd',
    haloStrength: 0.7,
    haloFalloff: 3,
    bandStrength: 0.0,
    shadowStrength: 0.16,
    envIntensity: 1.0,
    key: 3.5,
    rim: 1.5,
    glass: {
      color: '#ffffff',
      attenuationColor: '#8796ab',
      attenuationDistance: 1.7,
      thickness: 0.5,
      roughness: 0.05,
      ior: 1.45,
      iridescence: 0.8,
      iridescenceIOR: 1.3,
      iridescenceThicknessMinimum: 260,
      iridescenceThicknessMaximum: 460,
      dispersion: 2,
      specularIntensity: 1,
    },
  },
}

// Where the cat sits, as fractions of the canvas, and its height as a
// fraction of the canvas height. Desktop keeps it right of the text column;
// phones anchor it in the lower half of the first screen.
export function placement(width) {
  if (width >= 1280) return { cx: 0.71, cy: 0.52, h: 0.56 }
  if (width >= 960) return { cx: 0.75, cy: 0.52, h: 0.5 }
  return { cx: 0.5, cy: 0.7, h: 0.4 }
}
