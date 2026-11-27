extends SceneTree

func _initialize() -> void:
	var paths: PackedStringArray = _find("res://", "gdshader")
	for path: String in paths:
		print("compiling shader: ", path)
		var shader := load(path) as Shader
		if shader == null:
			push_error("Failed to load shader: " + path)
			quit(1)
			return
		shader.get_shader_uniform_list()
	print("Compiled %d shaders cleanly" % paths.size())
	quit(0)

func _find(dir: String, ext: String) -> PackedStringArray:
	var found := PackedStringArray()
	for f: String in DirAccess.get_files_at(dir):
		if f.get_extension() == ext:
			found.append(dir.path_join(f))
	for sub: String in DirAccess.get_directories_at(dir):
		if not sub.begins_with("."):
			found.append_array(_find(dir.path_join(sub), ext))
	return found
