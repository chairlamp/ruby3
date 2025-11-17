export type GpuCaps = {
  isWebGL2: boolean;
  instancing: boolean;
  vao: boolean;
  uintElem: boolean;
  derivatives: boolean;
  highpFrag: boolean;
};

export function probeCaps(gl: WebGLRenderingContext | WebGL2RenderingContext): GpuCaps {
  const isWebGL2 =
    typeof WebGL2RenderingContext !== "undefined" && gl instanceof WebGL2RenderingContext;
  const ext = (name: string) => gl.getExtension(name);
  const hi = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
  return {
    isWebGL2,
    instancing: isWebGL2 || !!ext("ANGLE_instanced_arrays"),
    vao: isWebGL2 || !!ext("OES_vertex_array_object"),
    uintElem: isWebGL2 || !!ext("OES_element_index_uint"),
    derivatives: isWebGL2 || !!ext("OES_standard_derivatives"),
    highpFrag: !!hi && hi.precision > 0,
  };
}
