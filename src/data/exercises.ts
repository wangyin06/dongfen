import type { CategoryId, CategoryMeta, Exercise } from '../types';

export const CATEGORY_META: Record<CategoryId, CategoryMeta> = {
  push: {
    id: 'push',
    label: '推',
    english: 'PUSH',
    description: '胸 · 肩 · 三头',
    color: 'var(--cat-push)',
    soft: 'var(--cat-push-soft)',
  },
  pull: {
    id: 'pull',
    label: '拉',
    english: 'PULL',
    description: '背 · 二头 · 肩胛',
    color: 'var(--cat-pull)',
    soft: 'var(--cat-pull-soft)',
  },
  legs: {
    id: 'legs',
    label: '腿',
    english: 'LEGS',
    description: '股四头 · 臀 · 后链',
    color: 'var(--cat-legs)',
    soft: 'var(--cat-legs-soft)',
  },
  core: {
    id: 'core',
    label: '核心',
    english: 'CORE',
    description: '抗伸展 · 抗旋转 · 下背',
    color: 'var(--cat-core)',
    soft: 'var(--cat-core-soft)',
  },
  grip: {
    id: 'grip',
    label: '握力',
    english: 'GRIP',
    description: '手指 · 前臂 · 悬垂',
    color: 'var(--cat-grip)',
    soft: 'var(--cat-grip-soft)',
  },
};

export const CATEGORY_LIST = Object.values(CATEGORY_META);

type ExerciseOptions = Partial<
  Pick<Exercise, 'unitType' | 'perSide' | 'level' | 'aliases' | 'cue' | 'equipment'>
>;

function ex(
  id: string,
  name: string,
  category: CategoryId,
  group: string,
  unitScore: number,
  options: ExerciseOptions = {},
): Exercise {
  return {
    id,
    name,
    category,
    group,
    unitScore,
    unitType: options.unitType ?? 'reps',
    perSide: options.perSide ?? false,
    level: options.level ?? 2,
    aliases: options.aliases ?? [],
    cue: options.cue ?? '',
    equipment: options.equipment ?? '无器械',
  };
}

/**
 * 预置动作库。分值单位：
 * - 次数动作：每 10 次
 * - 时间动作：每 30 秒
 * - 左右侧动作：每侧 10 次 / 每侧 30 秒
 *
 * 分值来自用户确认的计分表；新增变式按同一模式内的难度递进补齐。
 */
export const BUILTIN_EXERCISES: Exercise[] = [
  // ── 推：水平推 ─────────────────────────────────────────────
  ex('wall_push', '墙壁俯卧撑', 'push', '水平推', 0.08, {
    level: 1,
    aliases: ['推墙', 'wall push'],
    cue: '身体成一条直线，胸口靠近墙面，肩胛自然滑动。',
  }),
  ex('incline_push', '上斜俯卧撑', 'push', '水平推', 0.12, {
    level: 1,
    aliases: ['桌沿俯卧撑', 'incline push'],
    cue: '双手撑在桌沿或窗台，保持躯干刚性，胸口下放。',
  }),
  ex('knee_push', '跪姿俯卧撑', 'push', '水平推', 0.15, {
    level: 2,
    aliases: ['跪姿', 'knee push'],
    cue: '膝跪地，髋部伸直，胸口下放，不要塌腰。',
  }),
  ex('standard_push', '标准俯卧撑', 'push', '水平推', 0.3, {
    level: 3,
    aliases: ['俯卧撑', 'push up', 'pushup'],
    cue: '肩胛稳定，肘约 45°，头、髋、踝保持一条线。',
  }),
  ex('wide_push', '宽距俯卧撑', 'push', '水平推', 0.28, {
    level: 3,
    aliases: ['宽距', 'wide push'],
    cue: '双手略宽于肩，控制下放，避免耸肩。',
  }),
  ex('decline_push', '下斜俯卧撑', 'push', '水平推', 0.4, {
    level: 4,
    aliases: ['脚垫高', 'decline push'],
    cue: '脚垫高，重心前移，核心收紧，控制下放。',
  }),
  ex('diamond_push', '窄距俯卧撑', 'push', '水平推', 0.4, {
    level: 4,
    aliases: ['钻石俯卧撑', 'diamond push', '窄距'],
    cue: '双手成菱形，肘贴近身体，胸口向手的方向下放。',
  }),
  ex('tempo_push', '节奏俯卧撑', 'push', '水平推', 0.35, {
    level: 3,
    aliases: ['慢速俯卧撑', 'tempo push'],
    cue: '下放 3 秒、底部停 1 秒、推起 1 秒。',
  }),
  ex('deficit_push', '垫高俯卧撑', 'push', '水平推', 0.45, {
    level: 4,
    aliases: ['深俯卧撑', 'deficit push'],
    cue: '双手垫高，增加下放深度，肩胛保持稳定。',
  }),
  ex('archer_push', '弓箭手俯卧撑', 'push', '水平推', 0.55, {
    level: 5,
    aliases: ['archer push'],
    cue: '一侧手臂伸直，重心移向弯曲侧，控制推起。',
  }),
  ex('assisted_one_arm_push', '辅助单臂俯卧撑', 'push', '水平推', 0.7, {
    level: 5,
    aliases: ['单臂俯卧撑', 'one arm push'],
    cue: '另一手轻扶，控制单侧发力，骨盆不要旋转。',
  }),
  ex('pseudo_planche_push', '伪俄挺俯卧撑', 'push', '水平推', 0.65, {
    level: 5,
    aliases: ['pseudo planche', '前倾俯卧撑'],
    cue: '身体前移，肩胛前伸，保持骨盆稳定。',
  }),
  ex('explosive_push', '爆发俯卧撑', 'push', '水平推', 0.45, {
    level: 4,
    aliases: ['击掌俯卧撑', 'explosive push'],
    cue: '推起时离地，落地屈肘缓冲，保持核心收紧。',
  }),
  // ── 推：肩部 ───────────────────────────────────────────────
  ex('scapular_push', '肩胛俯卧撑', 'push', '肩部推', 0.15, {
    level: 1,
    aliases: ['肩胛', 'scapular push'],
    cue: '手臂伸直，只做肩胛前伸与后缩，不弯肘。',
  }),
  ex('pike_push', '派克俯卧撑', 'push', '肩部推', 0.3, {
    level: 3,
    aliases: ['折刀俯卧撑', 'pike push'],
    cue: '髋部抬高，头部向地面下放，肘向后。',
  }),
  ex('wall_handstand_push', '靠墙倒立撑', 'push', '肩部推', 0.5, {
    level: 4,
    aliases: ['倒立撑', 'handstand push'],
    cue: '靠墙倒立，控制下放和推起，肩胛保持稳定。',
  }),
  ex('wall_angel', '靠墙天使', 'push', '肩部推', 0.15, {
    level: 1,
    aliases: ['wall angel', '靠墙滑动'],
    cue: '背贴墙，手臂沿墙滑动，肋骨不要外翻。',
  }),
  ex('band_shoulder_press', '弹力带肩推', 'push', '肩部推', 0.15, {
    level: 1,
    aliases: ['肩推', 'band press'],
    equipment: '弹力带',
    cue: '弹力带踩在脚下，向上推举，避免耸肩。',
  }),
  ex('bench_dip', '椅子臂屈伸', 'push', '肩部推', 0.25, {
    level: 3,
    aliases: ['臂屈伸', 'bench dip'],
    equipment: '椅子',
    cue: '双手撑椅，肘向后弯，肩部不要前倾过多。',
  }),

  // ── 拉：垂直拉 ─────────────────────────────────────────────
  ex('dead_hang', '悬垂', 'pull', '垂直拉', 0.1, {
    unitType: 'seconds',
    level: 1,
    aliases: ['吊杠', 'dead hang'],
    equipment: '单杠',
    cue: '双手悬垂，肩胛保持稳定，不摆荡。',
  }),
  ex('scapular_pull', '肩胛引体', 'pull', '垂直拉', 0.15, {
    level: 1,
    aliases: ['肩胛下沉', 'scapular pull'],
    equipment: '单杠',
    cue: '手臂伸直，肩胛下沉后缩，身体不要摆动。',
  }),
  ex('negative_pull', '离心引体', 'pull', '垂直拉', 0.5, {
    level: 2,
    aliases: ['慢放引体', 'negative pull'],
    equipment: '单杠',
    cue: '跳到最高点，慢放 3–5 秒，控制到底部。',
  }),
  ex('band_assisted_pull', '弹力带辅助引体', 'pull', '垂直拉', 0.4, {
    level: 2,
    aliases: ['辅助引体', 'band pull'],
    equipment: '单杠 + 弹力带',
    cue: '弹力带踩脚或膝，辅助拉起，保持全程控制。',
  }),
  ex('standard_pull', '标准正手引体', 'pull', '垂直拉', 0.8, {
    level: 3,
    aliases: ['引体向上', 'pull up', 'pullup'],
    equipment: '单杠',
    cue: '正手握杠，下巴过杠，控制下放，不甩腿。',
  }),
  ex('wide_pull', '宽距引体', 'pull', '垂直拉', 1.0, {
    level: 4,
    aliases: ['宽握引体', 'wide pull'],
    equipment: '单杠',
    cue: '宽握，背部发力，避免耸肩和甩腿。',
  }),
  ex('chin_up', '反手引体', 'pull', '垂直拉', 0.8, {
    level: 3,
    aliases: ['chin up', '反握引体'],
    equipment: '单杠',
    cue: '反手握杠，二头参与更多，控制下放。',
  }),
  ex('weighted_pull', '负重引体', 'pull', '垂直拉', 1.5, {
    level: 5,
    aliases: ['负重引体向上', 'weighted pull'],
    equipment: '单杠 + 负重',
    cue: '负重引体，保持全程控制，不要借力。',
  }),
  // ── 拉：水平拉 ─────────────────────────────────────────────
  ex('band_row', '弹力带划船', 'pull', '水平拉', 0.15, {
    level: 1,
    aliases: ['弹力带拉背', 'band row'],
    equipment: '弹力带',
    cue: '弹力带固定，肘向后拉，肩胛后缩。',
  }),
  ex('australian_row', '澳式划船', 'pull', '水平拉', 0.25, {
    level: 2,
    aliases: ['低杠划船', 'australian row'],
    equipment: '单杠',
    cue: '低杠，身体斜直，胸口靠近杠，核心收紧。',
  }),
  ex('one_arm_australian', '单臂澳式划船', 'pull', '水平拉', 0.2, {
    perSide: true,
    level: 4,
    aliases: ['单臂划船', 'one arm row'],
    equipment: '单杠',
    cue: '单臂拉，核心抗旋转，身体保持一条线。',
  }),
  ex('towel_row', '毛巾划船', 'pull', '水平拉', 0.25, {
    level: 3,
    aliases: ['毛巾拉', 'towel row'],
    equipment: '毛巾 + 固定点',
    cue: '毛巾绕固定点，握紧拉，肘贴近身体。',
  }),
  ex('inverted_row', '反握划船', 'pull', '水平拉', 0.25, {
    level: 2,
    aliases: ['反手划船', 'inverted row'],
    equipment: '单杠',
    cue: '反握低杠，胸口触杠，控制下放。',
  }),
  ex('face_pull_band', '弹力带面拉', 'pull', '水平拉', 0.12, {
    level: 1,
    aliases: ['面拉', 'face pull'],
    equipment: '弹力带',
    cue: '拉向面部，肘高于手腕，肩胛后缩。',
  }),

  // ── 腿：膝主导 ─────────────────────────────────────────────
  ex('standard_squat', '标准深蹲', 'legs', '膝主导', 0.15, {
    level: 2,
    aliases: ['深蹲', 'squat'],
    cue: '脚肩同宽，膝盖对齐脚尖，髋部向后下坐。',
  }),
  ex('tempo_squat', '节奏深蹲', 'legs', '膝主导', 0.2, {
    level: 2,
    aliases: ['慢速深蹲', 'tempo squat'],
    cue: '下蹲 3 秒、底部停 1 秒、站起 1 秒。',
  }),
  ex('box_squat', '箱式深蹲', 'legs', '膝主导', 0.18, {
    level: 2,
    aliases: ['椅子深蹲', 'box squat'],
    equipment: '椅子',
    cue: '坐到椅子再站起，控制膝盖方向。',
  }),
  ex('single_leg_box_squat', '单腿箱式深蹲', 'legs', '膝主导', 0.2, {
    perSide: true,
    level: 3,
    aliases: ['单腿箱蹲', 'single leg box'],
    equipment: '椅子',
    cue: '单腿坐到箱上，另一腿前伸，控制下放。',
  }),
  ex('bulgarian_split', '保加利亚分腿蹲', 'legs', '膝主导', 0.3, {
    perSide: true,
    level: 4,
    aliases: ['保加利亚', 'bulgarian split'],
    equipment: '椅子',
    cue: '后脚搭椅，前腿下蹲，躯干保持稳定。',
  }),
  ex('assisted_pistol', '辅助手枪深蹲', 'legs', '膝主导', 0.4, {
    perSide: true,
    level: 4,
    aliases: ['单腿深蹲', 'pistol squat'],
    cue: '扶墙或门框，单腿下蹲，控制膝盖方向。',
  }),
  ex('weighted_squat', '负重深蹲', 'legs', '膝主导', 0.3, {
    level: 3,
    aliases: ['背包深蹲', 'weighted squat'],
    equipment: '背包',
    cue: '背包负重，保持躯干稳定，膝盖对齐脚尖。',
  }),
  ex('split_squat', '分腿蹲', 'legs', '膝主导', 0.22, {
    perSide: true,
    level: 3,
    aliases: ['静态弓步', 'split squat'],
    cue: '前后分腿，垂直下蹲，前腿发力站起。',
  }),
  ex('reverse_lunge', '后撤弓步', 'legs', '膝主导', 0.2, {
    perSide: true,
    level: 3,
    aliases: ['弓步', 'reverse lunge'],
    cue: '后撤一步，前腿发力，膝盖对齐脚尖。',
  }),
  ex('step_up', '登阶', 'legs', '膝主导', 0.2, {
    perSide: true,
    level: 2,
    aliases: ['上台阶', 'step up'],
    equipment: '稳固台阶',
    cue: '踩上稳固台阶，控制下放，不要蹬地借力。',
  }),
  // ── 腿：髋主导 / 小腿 ──────────────────────────────────────
  ex('glute_bridge', '臀桥', 'legs', '髋主导', 0.1, {
    level: 1,
    aliases: ['桥式', 'glute bridge'],
    cue: '仰卧屈膝，臀部抬起，顶端夹紧臀部。',
  }),
  ex('single_leg_glute', '单腿臀桥', 'legs', '髋主导', 0.15, {
    perSide: true,
    level: 2,
    aliases: ['单腿桥', 'single leg bridge'],
    cue: '单腿臀桥，骨盆保持水平，不要塌腰。',
  }),
  ex('backpack_rdl', '背包罗马尼亚硬拉', 'legs', '髋主导', 0.25, {
    level: 2,
    aliases: ['背包硬拉', 'backpack rdl'],
    equipment: '背包',
    cue: '背包负重，髋向后推，背部中立，膝盖微屈。',
  }),
  ex('single_leg_rdl', '单腿罗马尼亚硬拉', 'legs', '髋主导', 0.2, {
    perSide: true,
    level: 3,
    aliases: ['单腿硬拉', 'single leg rdl'],
    cue: '单腿站立，髋铰链，骨盆稳定，背部平直。',
  }),
  ex('good_morning', '早安式', 'legs', '髋主导', 0.15, {
    level: 2,
    aliases: ['good morning', '髋铰链'],
    cue: '髋铰链，背部平直，感受后链拉伸。',
  }),
  ex('hip_thrust', '臀推', 'legs', '髋主导', 0.12, {
    level: 1,
    aliases: ['hip thrust'],
    equipment: '椅子',
    cue: '上背靠椅，臀部向上顶，顶端停 1 秒。',
  }),
  ex('nordic_curl', '北欧腿弯举', 'legs', '髋主导', 0.45, {
    level: 5,
    aliases: ['nordic curl', '北欧弯举'],
    cue: '固定脚踝，身体慢放，尽量控制不塌腰。',
  }),
  ex('calf_raise', '提踵', 'legs', '小腿', 0.15, {
    level: 1,
    aliases: ['小腿', 'calf raise'],
    cue: '前脚掌发力，顶端停 1 秒，控制下放。',
  }),
  ex('weighted_calf', '负重提踵', 'legs', '小腿', 0.2, {
    level: 2,
    aliases: ['负重小腿', 'weighted calf'],
    equipment: '背包',
    cue: '背包负重提踵，保持身体直立。',
  }),
  ex('single_leg_calf', '单腿提踵', 'legs', '小腿', 0.15, {
    perSide: true,
    level: 2,
    aliases: ['单腿小腿', 'single leg calf'],
    cue: '单腿提踵，扶墙保持平衡，控制下放。',
  }),

  // ── 核心 / 下背 ────────────────────────────────────────────
  ex('bird_dog', '鸟狗式', 'core', '抗旋转', 0.1, {
    perSide: true,
    level: 1,
    aliases: ['鸟狗', 'bird dog'],
    cue: '对侧手脚伸直，骨盆不旋转，腰部保持稳定。',
  }),
  ex('superman', '超人式', 'core', '下背', 0.1, {
    level: 1,
    aliases: ['superman', '俯卧挺身'],
    cue: '俯卧，手脚同时抬起，下背发力，不要过度仰头。',
  }),
  ex('plank', '平板支撑', 'core', '抗伸展', 0.1, {
    unitType: 'seconds',
    level: 1,
    aliases: ['平板', 'plank'],
    cue: '肘撑地，身体一条线，核心收紧，臀部不要抬高。',
  }),
  ex('side_plank', '侧平板', 'core', '抗旋转', 0.1, {
    unitType: 'seconds',
    perSide: true,
    level: 2,
    aliases: ['侧桥', 'side plank'],
    cue: '侧肘撑地，髋部抬起，身体成一条线。',
  }),
  ex('reverse_plank', '反向平板', 'core', '抗伸展', 0.1, {
    unitType: 'seconds',
    level: 2,
    aliases: ['reverse plank'],
    cue: '仰面撑地，髋部抬起，身体成一条线。',
  }),
  ex('dead_bug', '死虫式', 'core', '抗伸展', 0.1, {
    perSide: true,
    level: 1,
    aliases: ['死虫', 'dead bug'],
    cue: '仰卧，对侧手脚下放，腰背始终贴地。',
  }),
  ex('hollow_hold', '空心支撑', 'core', '抗伸展', 0.12, {
    unitType: 'seconds',
    level: 2,
    aliases: ['hollow hold', '空心'],
    cue: '仰卧，肩和腿离地，腰部贴地，保持均匀呼吸。',
  }),
  ex('reverse_crunch', '反向卷腹', 'core', '屈曲', 0.15, {
    level: 1,
    aliases: ['reverse crunch'],
    cue: '屈膝，骨盆向后卷，控制下放，不要甩腿。',
  }),
  ex('hanging_knee_raise', '悬垂屈膝举腿', 'core', '屈曲', 0.25, {
    level: 3,
    aliases: ['悬垂举腿', 'hanging knee raise'],
    equipment: '单杠',
    cue: '悬垂，屈膝抬腿，控制不摆荡。',
  }),
  ex('seated_knee_tuck', '坐姿屈膝', 'core', '屈曲', 0.15, {
    level: 1,
    aliases: ['坐姿收腿', 'seated knee tuck'],
    cue: '坐姿，收膝向胸，控制伸展，不要弓背。',
  }),
  ex('russian_twist', '俄罗斯转体', 'core', '抗旋转', 0.12, {
    perSide: true,
    level: 2,
    aliases: ['转体', 'russian twist'],
    cue: '坐姿转体，保持脊柱延展，不要只甩手。',
  }),
  ex('bicycle_crunch', '自行车卷腹', 'core', '屈曲', 0.12, {
    perSide: true,
    level: 2,
    aliases: ['bicycle crunch', '空中自行车'],
    cue: '仰卧交替肘触膝，动作慢，腰部贴地。',
  }),
  ex('side_plank_dip', '侧平板下沉', 'core', '抗旋转', 0.15, {
    perSide: true,
    level: 3,
    aliases: ['side plank dip'],
    cue: '侧平板，髋部下沉再抬起，保持肩肘稳定。',
  }),
  ex('mountain_climber', '登山跑', 'core', '抗伸展', 0.1, {
    perSide: true,
    level: 2,
    aliases: ['mountain climber', '爬山'],
    cue: '平板撑，交替提膝，髋部保持稳定。',
  }),

  // ── 握力 ───────────────────────────────────────────────────
  ex('gripper', '握力器', 'grip', '握力器', 0.125, {
    perSide: true,
    level: 1,
    aliases: ['握力', 'gripper'],
    equipment: '握力器',
    cue: '缓慢闭合，完全打开，左右手分别记录。',
  }),
  ex('towel_hang', '毛巾悬垂', 'grip', '悬垂', 0.12, {
    unitType: 'seconds',
    level: 2,
    aliases: ['毛巾吊杠', 'towel hang'],
    equipment: '单杠 + 毛巾',
    cue: '毛巾绕杠，握紧悬垂，肩胛保持稳定。',
  }),
  ex('one_arm_hang', '单臂悬垂', 'grip', '悬垂', 0.2, {
    unitType: 'seconds',
    perSide: true,
    level: 4,
    aliases: ['单手悬垂', 'one arm hang'],
    equipment: '单杠',
    cue: '单臂悬垂，肩胛稳定，避免摆荡，左右分别记录。',
  }),
  ex('farmer_carry', '农夫行走', 'grip', '负重行走', 0.12, {
    unitType: 'seconds',
    level: 2,
    aliases: ['负重行走', 'farmer carry'],
    equipment: '负重物',
    cue: '双手负重行走，躯干直立，步幅稳定。',
  }),
  ex('plate_pinch', '捏握重物', 'grip', '捏握', 0.12, {
    perSide: true,
    level: 3,
    aliases: ['捏握', 'plate pinch'],
    equipment: '重物',
    cue: '手指捏住重物，保持稳定，左右手分别记录。',
  }),
];

export const BUILTIN_EXERCISE_MAP = new Map(BUILTIN_EXERCISES.map((item) => [item.id, item]));

export function mergeExercises(customExercises: Exercise[]): Exercise[] {
  return [...BUILTIN_EXERCISES, ...customExercises];
}

export function searchExercises(exercises: Exercise[], query: string): Exercise[] {
  const keyword = query.trim().toLowerCase();
  if (!keyword) return exercises;
  return exercises.filter((item) => {
    const haystack = [item.name, item.group, item.aliases.join(' '), item.equipment]
      .join(' ')
      .toLowerCase();
    return haystack.includes(keyword);
  });
}

export function exercisesInCategory(exercises: Exercise[], category: CategoryId | 'all'): Exercise[] {
  return category === 'all' ? exercises : exercises.filter((item) => item.category === category);
}

export function groupExercises(exercises: Exercise[]): Array<{
  category: CategoryId;
  group: string;
  items: Exercise[];
}> {
  const groups: Array<{ category: CategoryId; group: string; items: Exercise[] }> = [];
  for (const item of exercises) {
    const existing = groups.find((group) => group.category === item.category && group.group === item.group);
    if (existing) existing.items.push(item);
    else groups.push({ category: item.category, group: item.group, items: [item] });
  }
  return groups;
}
