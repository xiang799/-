window.portfolioContent={
  categories:[
    {id:'industrial',title:'工业设计',english:'INDUSTRIAL',color:'#a8cae4'},
    {id:'interaction',title:'交互设计',english:'INTERACTION',color:'#c2b9e5'},
    {id:'service',title:'体验与服务',english:'EXPERIENCE',color:'#aed9cd'},
    {id:'aigc',title:'AIGC 探索',english:'AIGC',color:'#aabbdc'},
    {id:'visual',title:'视觉与信息',english:'VISUAL',color:'#b4dce6'}
  ],
  projects:[
    {id:'dayibu',title:'搭衣簿',subtitle:'智能衣橱设计',categories:['industrial','interaction','service'],summary:'围绕独居青年的衣物管理、穿搭与收纳，探索智能衣橱的产品与交互方案。',featured:true,pdf:'media/dayibu.pdf',video:'media/dayibu.mp4'},
    {id:'robot',title:'钢索检测维修机器人',subtitle:'斜拉桥智能装备',categories:['industrial'],summary:'面向斜拉桥钢索的检测与维修作业，探索智能装备的结构、功能和造型。',featured:true},
    {id:'hike',title:'HikeShare',subtitle:'景区共享登山杖',categories:['industrial','service'],summary:'把多功能登山杖、共享站点与景区使用流程放在同一个服务场景中思考。',featured:true},
    {id:'season',title:'季载',subtitle:'二十四节气主题器具',categories:['industrial','visual'],summary:'从四季与节气出发，以器型、纹样和色彩组织一组主题器具。'},
    {id:'tea',title:'潮宗茶栈',subtitle:'街区服务设计',categories:['interaction','service'],summary:'以街区用户调研、用户画像与旅程图为起点，探索方言售茶机和空间服务。',featured:true},
    {id:'yaozhi',title:'药止',subtitle:'艺术疗愈平台概念',categories:['interaction'],summary:'面向药物成瘾人群的艺术疗愈平台概念与界面设计。'},
    {id:'lamp',title:'豆·葵',subtitle:'豆形灯具设计',categories:['industrial'],summary:'从豆形器与向日葵的形态中提取灵感，探索灯具的造型与光。'},
    {id:'chair',title:'渔',subtitle:'海洋废弃渔网再生座椅',categories:['industrial'],summary:'以废弃渔网和钢管为材料，探索海洋废弃物再利用的座椅设计。'},
    {id:'aurora',title:'极光科普装置',subtitle:'把自然现象变成体验',categories:['industrial','service'],summary:'以极光形成过程为主题，探索互动科普装置和体验。'},
    {id:'train',title:'City Voyager',subtitle:'未来城际磁悬浮列车',categories:['industrial','aigc'],summary:'结合 AI 形态探索，研究未来城际列车的外观与内饰设计。',featured:true,video:'media/train.mp4'},
    {id:'road',title:'茶马古道',subtitle:'文化信息可视化',categories:['visual'],summary:'用地图、图解与插画重新组织茶马古道的文化信息。'},
    {id:'vsd',title:'价值敏感设计',subtitle:'理论可视化与方案探索',categories:['interaction','visual'],summary:'以价值敏感设计理论为线索，探索骑手安全与激励方案。'},
    {id:'ct',title:'CT 机 LoRA',subtitle:'AIGC 产品设计工作流',categories:['aigc'],summary:'围绕 CT 机造型的数据集与模型训练，探索 AIGC 辅助产品设计。',external:'https://www.liblib.art/modelinfo/842a4c037189455993afa4bd55645e9b?from=search&versionUuid=537d9b8139764c0fbdeaec0f6ce0d001'},
    {id:'market',title:'碧湘街菜市场',subtitle:'产品与服务设计',categories:['industrial','interaction','service'],summary:'围绕菜市场的购物体验，探索共享买菜推车与配套小程序。',pdf:'media/market.pdf'},
    {id:'research',title:'苏泊尔吸尘器竞品分析',subtitle:'产品研究档案',categories:['industrial'],summary:'吸尘器竞品研究与分析资料，保留完整研究文档。',pdf:'media/research.pdf'}
  ],
  profile:{name:'陈湘',english:'Chen Xiang',focus:'产品设计 · 交互体验 · AIGC',email:'3273802897@qq.com',phone:'13974810029',photo:'media/portrait.jpg',resume:'media/resume.pdf',intro:'产品设计专业科班出身，关注实体产品、数字界面与日常体验之间的联系。喜欢从用户研究出发，通过三维建模、原型与 AIGC 探索，让想法逐步落地。',education:[['2025.09 — 至今','中南大学 · 设计学硕士在读'],['2021.09 — 2025.06','中南大学 · 产品设计本科']],experience:[['2026.06 — 2026.10','上海亦玩游乐设备有限公司','产品研发实习','参与产品造型与玩法设计、用户需求收集、Rhino / KeyShot 建模渲染及跨部门落地协作。'],['2024.09 — 2024.12','湖南极友科技有限公司','AIGC 岗产品助理实习','参与剧本、分镜图像、视频与海报创作，探索 AIGC 内容生产流程。']],skills:['Rhino','KeyShot','Figma','Photoshop','Illustrator','Axure','AIGC','After Effects'],honors:['湖南省大学生工业设计竞赛 · 省级一等奖、二等奖','BICC 中英国际设计大赛 · 银奖、铜奖','第 19 届“好创意”生成式人工智能计时赛 · 国家三等奖','2025—2026 研究生学业奖学金一等奖']},
  cmf:[
    {id:'dayibu',title:'模块化收纳',material:'木质框架 / 金属连接 / 塑料模块',colors:[['活力橙','#eaa52c'],['中性灰','#91918a'],['晴空蓝','#8db7d6']],image:1},
    {id:'chair',title:'再生的纤维',material:'废弃渔网 / 钢管',colors:[['渔网绿','#55766b'],['深海蓝','#365765'],['金属灰','#9da6a5']],image:0},
    {id:'season',title:'四季的颜色',material:'器型 / 色彩 / 纹样',colors:[['春','#779649'],['夏','#d12920'],['秋','#72127c'],['冬','#2e58a6']],image:1},
    {id:'lamp',title:'造型与光',material:'灯具体块 / 表面与光感',colors:[['豆绿','#a5bb94'],['奶油白','#ece9dc'],['暖光','#e4c58c']],image:1}
  ]
};
