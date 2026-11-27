shader_type canvas_item;

uniform vec4 glow_color : source_color = vec4(0.98, 0.80, 0.08, 1.0);
uniform float pulse_speed : hint_range(0.5, 8.0) = 3.2;

void fragment() {
	vec4 tex = texture(TEXTURE, UV);
	float pulse = 0.5 + 0.5 * sin(TIME * pulse_speed + UV.x * 6.2831);
	vec2 centered = UV - vec2(0.5);
	float d = length(centered) * 2.0;
	float ring = smoothstep(0.65, 0.85, d) * (1.0 - smoothstep(0.88, 1.0, d));
	vec3 col = mix(tex.rgb, glow_color.rgb, clamp(ring * (0.45 + 0.4 * pulse), 0.0, 0.85));
	float alpha = max(tex.a, ring * (0.45 + 0.25 * pulse));
	COLOR = vec4(col, alpha);
}
