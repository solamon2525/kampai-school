/*
  DC motor square-shaft spur gear
  Units: millimetres
  Inspired by a flat two-hole plastic spur gear.
*/

$fn = 120;

// ---- Editable dimensions ----
tooth_count = 40;
outside_diameter = 50;
root_diameter = 44;
gear_thickness = 4;

hub_diameter = 12;
hub_total_height = 9;

square_shaft_size = 5.5;  // Printed opening; measure the shaft before printing
shaft_clearance = 0.15;   // Added to each side of the square opening

mount_hole_diameter = 3.2;
mount_hole_radius = 11;

module gear_tooth() {
  tooth_pitch = PI * root_diameter / tooth_count;
  root_width = tooth_pitch * 0.66;
  tip_width = tooth_pitch * 0.34;
  root_radius = root_diameter / 2 - 0.1;
  tip_radius = outside_diameter / 2;

  linear_extrude(height = gear_thickness, center = true)
    polygon([
      [root_radius, -root_width / 2],
      [tip_radius, -tip_width / 2],
      [tip_radius, tip_width / 2],
      [root_radius, root_width / 2]
    ]);
}

module gear_body() {
  union() {
    cylinder(d = root_diameter, h = gear_thickness, center = true);

    for (i = [0 : tooth_count - 1])
      rotate([0, 0, i * 360 / tooth_count]) gear_tooth();

    translate([0, 0, (hub_total_height - gear_thickness) / 2])
      cylinder(d = hub_diameter, h = hub_total_height, center = true);
  }
}

difference() {
  gear_body();

  // Square DC motor shaft opening through the entire hub.
  cube([
    square_shaft_size + shaft_clearance * 2,
    square_shaft_size + shaft_clearance * 2,
    hub_total_height * 2 + 2
  ], center = true);

  // Two mounting/lightening holes matching the reference layout.
  for (side = [-1, 1])
    translate([side * mount_hole_radius, 0, 0])
      cylinder(d = mount_hole_diameter, h = gear_thickness + 2, center = true);
}
