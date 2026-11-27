shader_type canvas_item;

uniform float flash_amount : hint_range(0.0, 1.0) = 0.0;
uniform vec4 flash_color : source_color = vec4(1.0, 1.0, 1.0, 1.0);

void fragment() {
	vec4 tex = texture(TEXTURE, UV);
	vec3 mixed = mix(tex.rgb, flash_color.rgb, flash_amount);
	COLOR = vec4(mixed, tex.a * COLOR.a);
}
