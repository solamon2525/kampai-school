/*
  TT dual-shaft motor locking gear / hub
  Units: millimetres
  Default fit: common yellow TT motor 5.4 mm D-shaft + M3 captive nut.

  Print: PETG/PLA, 0.2 mm layers, 4 walls, 40% infill.
  Place one flat circular face on the build plate.
*/

$fn = 96;

// ---- Editable dimensions ----
shaft_diameter = 5.55;       // Increase by 0.10-0.20 if the fit is too tight
shaft_flat_depth = 0.65;     // Amount removed from the round shaft profile
body_diameter = 22;
body_thickness = 9;
tooth_count = 20;
tooth_depth = 1.5;
tooth_width_ratio = 0.48;

set_screw_diameter = 3.35;   // M3 clearance
nut_across_flats = 5.75;     // M3 nut, with print clearance
nut_thickness = 2.65;
nut_access_clearance = 0.35;

module d_bore(h) {
  difference() {
    cylinder(d = shaft_diameter, h = h, center = true);
    translate([shaft_diameter / 2 - shaft_flat_depth, -shaft_diameter, -h])
      cube([shaft_diameter, shaft_diameter * 2, h * 2]);
  }
}

module outer_gear() {
  union() {
    cylinder(d = body_diameter, h = body_thickness, center = true);
    for (i = [0 : tooth_count - 1])
      rotate([0, 0, i * 360 / tooth_count])
        translate([body_diameter / 2 + tooth_depth / 2 - 0.15, 0, 0])
          cube([
            tooth_depth + 0.3,
            PI * body_diameter / tooth_count * tooth_width_ratio,
            body_thickness
          ], center = true);
  }
}

module captive_nut_cut() {
  // Radial M3 screw presses against the D-shaft.
  rotate([0, 90, 0])
    cylinder(d = set_screw_diameter, h = body_diameter + tooth_depth * 4, center = true);

  // Hexagonal pocket opens from the rim so the M3 nut can slide in.
  translate([body_diameter / 2 - nut_thickness / 2 + nut_access_clearance, 0, 0])
    rotate([0, 90, 0])
      cylinder(d = nut_across_flats / cos(30), h = nut_thickness, center = true, $fn = 6);

  translate([body_diameter / 2 - nut_thickness / 2 + nut_access_clearance, 0,
             nut_across_flats / 2])
    cube([nut_thickness, nut_across_flats + 0.35, nut_across_flats], center = true);
}

difference() {
  outer_gear();
  d_bore(body_thickness + 2);
  captive_nut_cut();
}
