// Shared mutable state for photo-sphere look direction.
// Written by PhotoSphereControls (pointer drag) and read by CameraController.
export const photoSphereStore = {
  azimuth:     0.0,   // total horizontal look angle (radians) — kept in sync by CameraController
  elevation:   0.0,   // total vertical look angle (radians)  — kept in sync by CameraController
  userAzDelta: 0.0,   // accumulated horizontal drag offset added on top of scroll sweep
  userElDelta: 0.0,   // accumulated vertical drag offset (user-driven only)
  isDragging:  false,
  activePhase: -1,    // which photo-sphere phase is currently active (4 or 5); -1 = none
};
