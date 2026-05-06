// Shared mutable state for photo-sphere look direction.
// Written by PhotoSphereControls (pointer drag) and read by CameraController.
//
// Keyed by phase index (3 = Jungle, 4 = Clouds, 5 = Forest) so each
// photo sphere has its own independent look direction — drag in one phase
// does not carry over to the next.
export const photoSphereStore: Record<number, { azimuth: number; elevation: number }> = {
  3: { azimuth: 0.0,  elevation: 0.05 },  // Jungle
  4: { azimuth: 0.0,  elevation: 0.05 },  // Above Clouds
  5: { azimuth: 0.0,  elevation: 0.05 },  // Enchanted Forest
};
