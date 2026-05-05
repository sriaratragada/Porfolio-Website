// Shared mutable state for photo-sphere look direction.
// Written by PhotoSphereControls (pointer drag) and read by CameraController.
export const photoSphereStore = {
  azimuth:   0.0,   // horizontal angle (radians)
  elevation: 0.05,  // vertical angle (radians), clamped ±35°
};
