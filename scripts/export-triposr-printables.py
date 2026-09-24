import trimesh
from pathlib import Path

src = Path(r"D:\kampai-school-main\exports\3d-print\staff-duo-image-to-3d\0\mesh.obj")
out = Path(r"D:\kampai-school-main\exports\3d-print\staff-duo-image-to-3d")

mesh = trimesh.load(src, force="mesh")
print("loaded", mesh)
print("bounds", mesh.bounds)
print("extents", mesh.extents)
print("faces", len(mesh.faces), "verts", len(mesh.vertices))

# Center on XY, put lowest point on Z=0, scale tallest axis to 120mm
mesh.apply_translation(-mesh.bounds[0])
mesh.apply_translation([-mesh.extents[0] / 2, -mesh.extents[1] / 2, 0])

tallest = float(mesh.extents.max())
scale = 120.0 / tallest if tallest > 0 else 1.0
mesh.apply_scale(scale)
print("print scale", scale, "new extents mm", mesh.extents)

trimesh.repair.fix_normals(mesh)
trimesh.repair.fix_inversion(mesh)

stl = out / "staff-duo-triposr-120mm.stl"
glb = out / "staff-duo-triposr.glb"
obj = out / "staff-duo-triposr.obj"
mesh.export(stl)
mesh.export(glb)
mesh.export(obj)
print("wrote", stl, stl.stat().st_size)
print("wrote", glb, glb.stat().st_size)
print("wrote", obj, obj.stat().st_size)

try:
    png = out / "staff-duo-triposr-preview.png"
    scene = mesh.scene()
    png_data = scene.save_image(resolution=(800, 800), visible=True)
    if png_data:
        png.write_bytes(png_data)
        print("preview", png)
    else:
        print("preview skipped (no image data)")
except Exception as e:
    print("preview failed:", e)
