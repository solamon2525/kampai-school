/*
  DC motor round disc with tall square hub and four mounting holes
  Units: millimetres
*/

$fn = 144;

// ---- Editable dimensions ----
disc_diameter = 50;
disc_thickness = 4;

square_hub_size = 14;
hub_total_height = 16;

square_shaft_size = 5.5;
shaft_clearance = 0.15;  // Opening becomes 5.8 x 5.8 mm

mount_hole_diameter = 4.5;  // M4 clearance with allowance for FDM printing
mount_hole_radius = 14;
mount_hole_count = 4;

module disc_and_hub() {
  union() {
    cylinder(d = disc_diameter, h = disc_thickness, center = true);

    // Tall square boss rises from the top face of the round disc.
    translate([0, 0, (hub_total_height - disc_thickness) / 2])
      cube([square_hub_size, square_hub_size, hub_total_height], center = true);
  }
}

difference() {
  disc_and_hub();

  // Square motor-shaft opening through the full height of the boss.
  cube([
    square_shaft_size + shaft_clearance * 2,
    square_shaft_size + shaft_clearance * 2,
    hub_total_height * 2 + 2
  ], center = true);

  // Four evenly spaced mounting holes.
  for (i = [0 : mount_hole_count - 1])
    rotate([0, 0, 45 + i * 360 / mount_hole_count])
      translate([mount_hole_radius, 0, 0])
        cylinder(d = mount_hole_diameter, h = disc_thickness + 2, center = true);
}
