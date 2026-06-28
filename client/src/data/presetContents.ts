// 预置内容库 - 古诗、文言文、经典文章
export interface PresetContent {
  id: string;
  title: string;
  author: string;
  dynasty: string;
  content: string;
  category: '诗' | '词' | '文言文' | '现代文';
  difficulty: '初级' | '中级' | '高级';
}

export const presetContents: PresetContent[] = [
  // 唐诗
  {
    id: 'jingye-si',
    title: '静夜思',
    author: '李白',
    dynasty: '唐',
    content: '床前明月光，疑是地上霜。举头望明月，低头思故乡。',
    category: '诗',
    difficulty: '初级',
  },
  {
    id: 'dengguanquelou',
    title: '登鹳雀楼',
    author: '王之涣',
    dynasty: '唐',
    content: '白日依山尽，黄河入海流。欲穷千里目，更上一层楼。',
    category: '诗',
    difficulty: '初级',
  },
  {
    id: 'chunxiao',
    title: '春晓',
    author: '孟浩然',
    dynasty: '唐',
    content: '春眠不觉晓，处处闻啼鸟。夜来风雨声，花落知多少。',
    category: '诗',
    difficulty: '初级',
  },
  {
    id: 'xiangsi',
    title: '相思',
    author: '王维',
    dynasty: '唐',
    content: '红豆生南国，春来发几枝。愿君多采撷，此物最相思。',
    category: '诗',
    difficulty: '初级',
  },
  {
    id: 'wanglushanpubu',
    title: '望庐山瀑布',
    author: '李白',
    dynasty: '唐',
    content: '日照香炉生紫烟，遥看瀑布挂前川。飞流直下三千尺，疑是银河落九天。',
    category: '诗',
    difficulty: '初级',
  },
  {
    id: 'zaoxiaochengdu',
    title: '早发白帝城',
    author: '李白',
    dynasty: '唐',
    content: '朝辞白帝彩云间，千里江陵一日还。两岸猿声啼不住，轻舟已过万重山。',
    category: '诗',
    difficulty: '初级',
  },
  {
    id: 'fengqiaoyebo',
    title: '枫桥夜泊',
    author: '张继',
    dynasty: '唐',
    content: '月落乌啼霜满天，江枫渔火对愁眠。姑苏城外寒山寺，夜半钟声到客船。',
    category: '诗',
    difficulty: '中级',
  },
  {
    id: 'denggao',
    title: '登高',
    author: '杜甫',
    dynasty: '唐',
    content: '风急天高猿啸哀，渚清沙白鸟飞回。无边落木萧萧下，不尽长江滚滚来。万里悲秋常作客，百年多病独登台。艰难苦恨繁霜鬓，潦倒新停浊酒杯。',
    category: '诗',
    difficulty: '高级',
  },
  {
    id: 'shuidao',
    title: '蜀道难',
    author: '李白',
    dynasty: '唐',
    content: '噫吁嚱，危乎高哉！蜀道之难，难于上青天！蚕丛及鱼凫，开国何茫然！尔来四万八千岁，不与秦塞通人烟。西当太白有鸟道，可以横绝峨眉巅。地崩山摧壮士死，然后天梯石栈相钩连。上有六龙回日之高标，下有冲波逆折之回川。黄鹤之飞尚不得过，猿猱欲度愁攀援。青泥何盘盘，百步九折萦岩峦。扪参历井仰胁息，以手抚膺坐长叹。',
    category: '诗',
    difficulty: '高级',
  },
  
  // 宋词
  {
    id: 'shuidiaogetou',
    title: '水调歌头·明月几时有',
    author: '苏轼',
    dynasty: '宋',
    content: '明月几时有？把酒问青天。不知天上宫阙，今夕是何年。我欲乘风归去，又恐琼楼玉宇，高处不胜寒。起舞弄清影，何似在人间。转朱阁，低绮户，照无眠。不应有恨，何事长向别时圆？人有悲欢离合，月有阴晴圆缺，此事古难全。但愿人长久，千里共婵娟。',
    category: '词',
    difficulty: '中级',
  },
  {
    id: 'niannujiao',
    title: '念奴娇·赤壁怀古',
    author: '苏轼',
    dynasty: '宋',
    content: '大江东去，浪淘尽，千古风流人物。故垒西边，人道是，三国周郎赤壁。乱石穿空，惊涛拍岸，卷起千堆雪。江山如画，一时多少豪杰。遥想公瑾当年，小乔初嫁了，雄姿英发。羽扇纶巾，谈笑间，樯橹灰飞烟灭。故国神游，多情应笑我，早生华发。人生如梦，一尊还酹江月。',
    category: '词',
    difficulty: '高级',
  },
  {
    id: 'qingpingyue',
    title: '清平乐·村居',
    author: '辛弃疾',
    dynasty: '宋',
    content: '茅檐低小，溪上青青草。醉里吴音相媚好，白发谁家翁媪？大儿锄豆溪东，中儿正织鸡笼。最喜小儿亡赖，溪头卧剥莲蓬。',
    category: '词',
    difficulty: '初级',
  },
  {
    id: 'yumeiren',
    title: '虞美人·春花秋月何时了',
    author: '李煜',
    dynasty: '五代',
    content: '春花秋月何时了？往事知多少。小楼昨夜又东风，故国不堪回首月明中。雕栏玉砌应犹在，只是朱颜改。问君能有几多愁？恰似一江春水向东流。',
    category: '词',
    difficulty: '中级',
  },
  
  // 文言文
  {
    id: 'lunyu-xueer',
    title: '论语·学而篇（节选）',
    author: '孔子',
    dynasty: '春秋',
    content: '子曰："学而时习之，不亦说乎？有朋自远方来，不亦乐乎？人不知而不愠，不亦君子乎？"\n\n有子曰："其为人也孝弟，而好犯上者，鲜矣；不好犯上，而好作乱者，未之有也。君子务本，本立而道生。孝弟也者，其为仁之本与？"\n\n子曰："巧言令色，鲜矣仁！"',
    category: '文言文',
    difficulty: '中级',
  },
  {
    id: 'chushibiao',
    title: '出师表（节选）',
    author: '诸葛亮',
    dynasty: '三国',
    content: '先帝创业未半而中道崩殂，今天下三分，益州疲弊，此诚危急存亡之秋也。然侍卫之臣不懈于内，忠志之士忘身于外者，盖追先帝之殊遇，欲报之于陛下也。诚宜开张圣听，以光先帝遗德，恢弘志士之气，不宜妄自菲薄，引喻失义，以塞忠谏之路也。\n\n宫中府中，俱为一体，陟罚臧否，不宜异同。若有作奸犯科及为忠善者，宜付有司论其刑赏，以昭陛下平明之理，不宜偏私，使内外异法也。',
    category: '文言文',
    difficulty: '高级',
  },
  {
    id: 'aiwangyue',
    title: '爱莲说',
    author: '周敦颐',
    dynasty: '宋',
    content: '水陆草木之花，可爱者甚蕃。晋陶渊明独爱菊。自李唐来，世人甚爱牡丹。予独爱莲之出淤泥而不染，濯清涟而不妖，中通外直，不蔓不枝，香远益清，亭亭净植，可远观而不可亵玩焉。\n\n予谓菊，花之隐逸者也；牡丹，花之富贵者也；莲，花之君子者也。噫！菊之爱，陶后鲜有闻。莲之爱，同予者何人？牡丹之爱，宜乎众矣。',
    category: '文言文',
    difficulty: '中级',
  },
  {
    id: 'shiyiji',
    title: '师说（节选）',
    author: '韩愈',
    dynasty: '唐',
    content: '古之学者必有师。师者，所以传道受业解惑也。人非生而知之者，孰能无惑？惑而不从师，其为惑也，终不解矣。生乎吾前，其闻道也固先乎吾，吾从而师之；生乎吾后，其闻道也亦先乎吾，吾从而师之。吾师道也，夫庸知其年之先后生于吾乎？是故无贵无贱，无长无少，道之所存，师之所存也。',
    category: '文言文',
    difficulty: '高级',
  },
  {
    id: 'zuozhuan',
    title: '左传·曹刿论战（节选）',
    author: '左丘明',
    dynasty: '春秋',
    content: '十年春，齐师伐我。公将战，曹刿请见。其乡人曰："肉食者谋之，又何间焉？"刿曰："肉食者鄙，未能远谋。"乃入见。问："何以战？"公曰："衣食所安，弗敢专也，必以分人。"对曰："小惠未遍，民弗从也。"公曰："牺牲玉帛，弗敢加也，必以信。"对曰："小信未孚，神弗福也。"公曰："小大之狱，虽不能察，必以情。"对曰："忠之属也。可以一战。战则请从。"',
    category: '文言文',
    difficulty: '高级',
  },
  
  // 现代文
  {
    id: 'qingchun',
    title: '青春（节选）',
    author: '李大钊',
    dynasty: '现代',
    content: '青春者，人生之王，人生之春，人生之华也。人之生也，必有其青年之一时期，犹一年之有春也。青年之字典，无"困难"之字，青年之口头，无"障碍"之语；惟知跃进，惟知雄飞，惟知本其自由之精神，奇僻之思想，锐敏之直觉，活泼之生命，以创造环境，征服历史。',
    category: '现代文',
    difficulty: '中级',
  },
  {
    id: 'heitan',
    title: '荷塘月色（节选）',
    author: '朱自清',
    dynasty: '现代',
    content: '曲曲折折的荷塘上面，弥望的是田田的叶子。叶子出水很高，像亭亭的舞女的裙。层层的叶子中间，零星地点缀着些白花，有袅娜地开着的，有羞涩地打着朵儿的；正如一粒粒的明珠，又如碧天里的星星，又如刚出浴的美人。微风过处，送来缕缕清香，仿佛远处高楼上渺茫的歌声似的。',
    category: '现代文',
    difficulty: '中级',
  },
  {
    id: 'rencheng',
    title: '人生（节选）',
    author: '冰心',
    dynasty: '现代',
    content: '成功的花，人们只惊羡她现时的明艳！然而当初她的芽儿，浸透了奋斗的泪泉，洒遍了牺牲的血雨。\n\n墙角的花，你孤芳自赏时，天地便小了。\n\n青年啊，为着后来的回忆，小心着意地描绘你现在的图画。',
    category: '现代文',
    difficulty: '初级',
  },
  {
    id: 'jiayuan',
    title: '家园落日（节选）',
    author: '莫怀戚',
    dynasty: '现代',
    content: '我很重要。我对自己小声说。我还不习惯嘹亮地宣布这一主张，我们在不重要中生活得太久了。我很重要。\n\n我的独出心裁的创意，像鸽群一般在天空翱翔，只有我才捉得住它们的羽毛。我的设想像珍珠一般散落在海滩上，等待着我把它们用金线串起。我的意志向前延伸，直到地平线消失的远方。',
    category: '现代文',
    difficulty: '中级',
  },
];

// 按分类分组
export function getPresetsByCategory(): Record<string, PresetContent[]> {
  const categories: Record<string, PresetContent[]> = {};
  
  for (const item of presetContents) {
    if (!categories[item.category]) {
      categories[item.category] = [];
    }
    categories[item.category].push(item);
  }
  
  return categories;
}

// 搜索预置内容
export function searchPresets(keyword: string): PresetContent[] {
  if (!keyword.trim()) return presetContents;
  
  const lower = keyword.toLowerCase();
  return presetContents.filter(item => 
    item.title.toLowerCase().includes(lower) ||
    item.author.toLowerCase().includes(lower) ||
    item.content.toLowerCase().includes(lower)
  );
}
