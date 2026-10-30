import {
  AspectRatioOption,
  CreatorizeProject,
  ExportResolution,
  TimelineShot,
} from '../types/creatorize';

export interface BlenderScriptOptions {
  fps?: number;
  resolution?: ExportResolution;
  aspectRatio?: AspectRatioOption;
  renderEngine?: 'EEVEE_NEXT' | 'CYCLES';
  customAvatarName?: string;
}

function getResolutionDimensions(
  resolution: ExportResolution = '4K',
  aspectRatio: AspectRatioOption = '9:16'
): { width: number; height: number } {
  if (resolution === '4K') {
    return aspectRatio === '9:16'
      ? { width: 2160, height: 3840 }
      : { width: 3840, height: 2160 };
  }
  return aspectRatio === '9:16'
    ? { width: 1080, height: 1920 }
    : { width: 1920, height: 1080 };
}

function buildSceneSpecificGeometryCode(shot: TimelineShot, customAvatarName?: string): string {
  const avatarComment = customAvatarName
    ? `\n    # Optional Custom Character Avatar Rig: "${customAvatarName}"`
    : '';

  if (shot.sceneType.startsWith('bottle-')) {
    return `def build_subject_geometry():
    # Zack D. Glass Bottle Thermal Shock & Cutting Simulation (${shot.sceneType})${avatarComment}
    bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=0.85, depth=3.2, location=(0, 0, 0.5))
    bottle = bpy.context.active_object
    bottle.name = "GlassBottle_${shot.shotNumber}"

    # Glass BSDF shader (IOR 1.52)
    glass_mat = bpy.data.materials.new(name="GreenGlassMaterial_${shot.shotNumber}")
    glass_mat.use_nodes = True
    bsdf = glass_mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (0.12, 0.78, 0.52, 1.0)
        bsdf.inputs["Roughness"].default_value = 0.04
        bsdf.inputs["Transmission Weight"].default_value = 0.92
    bottle.data.materials.append(glass_mat)

    # Cotton string ring & thermal fracture plane at Z = 0.45m
    bpy.ops.mesh.primitive_torus_add(major_radius=0.87, minor_radius=0.035, location=(0, 0, 0.45))
    cotton_string = bpy.context.active_object
    cotton_string.name = "CottonString_ThermalLine_${shot.shotNumber}"

    bottle.rotation_euler = (0.0, 0.0, 0.0)
    bottle.keyframe_insert(data_path="rotation_euler", frame=${shot.startFrame})
    bottle.rotation_euler = (0.15, 0.0, math.radians(180))
    bottle.keyframe_insert(data_path="rotation_euler", frame=${shot.endFrame})`;
  }

  if (shot.sceneType.startsWith('everest-')) {
    return `def build_subject_geometry():
    # Zack D. Mega-Engineering Mount Everest Relocation Cutaway (${shot.sceneType})${avatarComment}
    bpy.ops.mesh.primitive_cube_add(size=4.2, location=(0, 0, -0.2))
    crust_slab = bpy.context.active_object
    crust_slab.scale = (1.4, 1.4, 0.45)
    crust_slab.name = "ContinentalCrustSlab_${shot.shotNumber}"

    bpy.ops.mesh.primitive_cone_add(vertices=7, radius1=2.1, radius2=0.15, depth=3.1, location=(0, 0, 1.65))
    everest_peak = bpy.context.active_object
    everest_peak.name = "MountEverestPeak_${shot.shotNumber}"

    # Steel mesh reinforcement / thermal drill / maglev keyframe motion
    everest_peak.location = (0.0, 0.0, 1.65)
    everest_peak.keyframe_insert(data_path="location", frame=${shot.startFrame})
    everest_peak.location = (0.0, 0.35, 1.78)
    everest_peak.keyframe_insert(data_path="location", frame=${shot.endFrame})`;
  }

  if (shot.sceneType.startsWith('bullet-')) {
    return `def build_subject_geometry():
    # Zack D. Internal Ballistics & Cartridge Cutaway (${shot.sceneType})${avatarComment}
    bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=0.62, depth=2.4, location=(0, -0.4, 0.6))
    casing = bpy.context.active_object
    casing.rotation_euler = (math.radians(90), 0.0, 0.0)
    casing.name = "BrassCartridgeCutaway_${shot.shotNumber}"

    bpy.ops.mesh.primitive_cone_add(vertices=48, radius1=0.58, radius2=0.08, depth=1.35, location=(0, 1.1, 0.6))
    projectile = bpy.context.active_object
    projectile.rotation_euler = (math.radians(-90), 0.0, 0.0)
    projectile.name = "CopperProjectile_${shot.shotNumber}"

    # Firing pin strike & high-pressure smokeless powder gas expansion keyframes
    projectile.location = (0.0, 1.1, 0.6)
    projectile.keyframe_insert(data_path="location", frame=${shot.startFrame})
    projectile.location = (0.0, 3.6, 0.6)
    projectile.keyframe_insert(data_path="location", frame=${shot.endFrame})`;
  }

  return `def build_subject_geometry():
    # Centerpiece 3D educational model for '${shot.sceneType}' (${shot.title})${avatarComment}
    bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=0.85, depth=3.2, location=(0, 0, 0.5))
    subject = bpy.context.active_object
    subject.name = "PrimarySubject_${shot.shotNumber}"

    # Animate rotation / physics keyframes synced to word timestamps
    subject.rotation_euler = (0.0, 0.0, 0.0)
    subject.keyframe_insert(data_path="rotation_euler", frame=${shot.startFrame})
    subject.rotation_euler = (0.15, 0.0, math.radians(180))
    subject.keyframe_insert(data_path="rotation_euler", frame=${shot.endFrame})`;
}

export function generateShotBlenderScript(
  shot: TimelineShot,
  globalStyleKey: string,
  fps = 30,
  options?: BlenderScriptOptions
): string {
  const effectiveFps = options?.fps ?? fps;
  const { width, height } = getResolutionDimensions(
    options?.resolution ?? '1080p',
    options?.aspectRatio ?? '9:16'
  );
  const engineName =
    options?.renderEngine === 'CYCLES' ? 'CYCLES' : 'BLENDER_EEVEE_NEXT';
  const subjectGeometryFn = buildSceneSpecificGeometryCode(
    shot,
    options?.customAvatarName
  );

  return `import bpy
import math

# ==============================================================================
# Creatorize Studio — Opus 5.5 Automated Blender 3D Scene Builder
# Shot #${shot.shotNumber}: ${shot.title}
# Narration: ${shot.narration}
# Frames: ${shot.startFrame} -> ${shot.endFrame} (${shot.startSec.toFixed(1)}s - ${shot.endSec.toFixed(1)}s @ ${effectiveFps} FPS)
# Global Style Key: ${globalStyleKey}
# ==============================================================================

def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.fps = ${effectiveFps}
    scene.frame_start = ${shot.startFrame}
    scene.frame_end = ${shot.endFrame}
    scene.render.resolution_x = ${width}
    scene.render.resolution_y = ${height}
    scene.render.engine = '${engineName}'

def build_zack_d_infinite_blue_grid():
    # Bluish infinite grid background characteristic of Zack D. Films
    world = bpy.data.worlds.new("ZackDWorld")
    bpy.context.scene.world = world
    world.use_nodes = True
    bg_node = world.node_tree.nodes.get("Background")
    if bg_node:
        bg_node.inputs[0].default_value = (0.024, 0.065, 0.165, 1.0)
        bg_node.inputs[1].default_value = 1.15

    bpy.ops.mesh.primitive_grid_add(x_subdivisions=64, y_subdivisions=64, size=60.0, location=(0, 0, -1.2))
    grid_obj = bpy.context.active_object
    grid_obj.name = "BluishInfiniteGrid"
    mat = bpy.data.materials.new(name="ZackGridMaterial")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (0.08, 0.28, 0.68, 1.0)
        bsdf.inputs["Roughness"].default_value = 0.25
        bsdf.inputs["Metallic"].default_value = 0.4
    grid_obj.data.materials.append(mat)

${subjectGeometryFn}

def setup_studio_camera_and_lights():
    bpy.ops.object.camera_add(location=(0.0, -5.8, 2.1), rotation=(math.radians(74), 0.0, 0.0))
    cam = bpy.context.active_object
    cam.name = "ZackDMacroCamera"
    bpy.context.scene.camera = cam

    cam.keyframe_insert(data_path="location", frame=${shot.startFrame})
    cam.location = (0.0, -4.4, 1.75)
    cam.keyframe_insert(data_path="location", frame=${shot.endFrame})

    bpy.ops.object.light_add(type='AREA', location=(3.5, -3.0, 4.5))
    key_light = bpy.context.active_object
    key_light.data.energy = 650.0
    key_light.data.color = (0.88, 0.94, 1.0)

if __name__ == "__main__":
    reset_scene()
    build_zack_d_infinite_blue_grid()
    build_subject_geometry()
    setup_studio_camera_and_lights()
`;
}

export function generateFullProjectBlenderScript(
  project: CreatorizeProject,
  renderEngine: 'EEVEE_NEXT' | 'CYCLES' = 'EEVEE_NEXT',
  fps: 30 | 60 = 30
): string {
  const header = `# ==============================================================================
# CREATORIZE STUDIO — FULL PROJECT BLENDER PYTHON EXPORT
# Project: ${project.name}
# Style: ${project.settings.styleId}
# Model: ${project.settings.aiModel} (Effort: ${project.settings.effortLevel})
# Quality Pass: ${project.settings.qualityMode} | Time Limit: ${project.settings.timeLimit}
# Resolution: ${project.settings.resolution} (${project.settings.aspectRatio}) | Engine: ${renderEngine}
# Moments (Google Flow): ${project.settings.momentsCount}
# Global Style Key: ${project.settings.globalStyleKey}
# ==============================================================================
`;
  const body = project.shots
    .map((shot) =>
      generateShotBlenderScript(shot, project.settings.globalStyleKey, fps, {
        fps,
        resolution: project.settings.resolution,
        aspectRatio: project.settings.aspectRatio,
        renderEngine,
        customAvatarName: project.settings.customAvatarName,
      })
    )
    .join('\n\n');
  return `${header}\n${body}`;
}
