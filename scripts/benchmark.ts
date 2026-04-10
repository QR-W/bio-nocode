/**
 * 领域知识注入对比实验脚本
 *
 * 目的: 量化对比"注入领域知识 vs 不注入领域知识"时LLM生成的AppConfig质量差异
 *
 * 运行方式:
 *   1. 将此文件放入项目 scripts/benchmark.ts
 *   2. 安装依赖: npm install openai tsx --save-dev
 *   3. 设置环境变量: export DEEPSEEK_API_KEY=sk-xxx  (Windows用 set)
 *   4. 运行: npx tsx scripts/benchmark.ts
 *
 * 结果将输出到控制台并保存至 scripts/benchmark_results/results_<时间戳>.json
 */

import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

// ============================================================
// 1. 配置
// ============================================================

const API_KEY = process.env.DEEPSEEK_API_KEY || '';
if (!API_KEY) {
    console.error('请设置环境变量 DEEPSEEK_API_KEY');
    process.exit(1);
}

const client = new OpenAI({
    apiKey: API_KEY,
    baseURL: 'https://api.deepseek.com/v1',
});

const MODEL = 'deepseek-chat';
const TEMPERATURE = 0.3;  // 低温度降低随机性, 保证实验可复现
const REPEAT = 3;         // 每组重复次数
const REQUEST_INTERVAL_MS = 1000; // API限速间隔

// ============================================================
// 2. 提示词模板
// ============================================================

const SYSTEM_ROLE_PROMPT = `你是一个面向细胞生物学实验室的零代码应用生成助手。
你的任务是根据用户的自然语言需求,生成结构化的应用配置(AppConfig)。`;

const JSON_FORMAT_PROMPT = `请以严格的JSON格式返回应用配置,禁止添加任何解释性文字或markdown代码块包裹。
返回的JSON必须符合以下schema:
{
  "name": "string",
  "description": "string",
  "experimentType": "string",
  "fields": [
    {
      "name": "string (字段内部标识)",
      "label": "string (显示标签)",
      "type": "text | textarea | number | date | select | multiselect | boolean | file",
      "required": boolean,
      "unit": "string (可选, 数值字段单位如 cells/mL, μg, %, h)",
      "options": ["string"],
      "validation": { "min": number, "max": number }
    }
  ],
  "pages": [
    {
      "key": "string",
      "title": "string",
      "components": ["DataForm" | "DataTable" | "ChartView" | "StatsCards" | "SearchBar" | "LoginForm"]
    }
  ]
}`;

// 六类实验类型的领域知识(简化版, 可直接复用 prompts.ts 中的完整版)
const DOMAIN_KNOWLEDGE_MAP: Record<string, string> = {
    passage: `你正在为用户生成细胞传代培养记录应用。

【必备字段】
- 细胞系名称 (cellLine): text类型
- 传代代数 (passageNumber): number类型
- 接种密度 (seedingDensity): number类型, 单位 cells/mL
- 培养基类型 (medium): select类型, 常见: DMEM/RPMI-1640/F-12/MEM
- 培养时长 (duration): number类型, 单位 h
- 汇合度 (confluence): number类型, 单位 %, 范围 0-100
- 胰酶消化时间 (digestionTime): number类型, 单位 min
- 操作日期 (date): date类型
- 操作者 (operator): text类型

【推荐页面】数据录入(DataForm) / 历史列表(DataTable) / 代数趋势(ChartView)`,

    cryopreservation: `你正在为用户生成细胞冻存与复苏记录应用。

【必备字段】
- 细胞系名称 (cellLine): text
- 传代代数 (passageNumber): number
- 冻存管编号 (vialId): text
- 冻存日期 (freezeDate): date
- 冻存液配方 (cryoMedium): text (如 10% DMSO + 90% FBS)
- 细胞数量 (cellCount): number, 单位 cells/vial
- 液氮罐位置 (storageLocation): text
- 复苏日期 (thawDate): date
- 复苏后存活率 (viability): number, 单位 %, 范围 0-100
- 操作者 (operator): text

【推荐页面】冻存记录 / 复苏记录 / 库存管理`,

    transfection: `你正在为用户生成转染实验记录应用。

【必备字段】
- 细胞系名称 (cellLine): text
- 载体名称 (vector): text (如 pcDNA3.1, pLVX)
- 转染试剂 (reagent): select, 常见: Lipofectamine 2000/3000, PEI, 电转
- 试剂用量 (reagentAmount): number, 单位 μL
- DNA用量 (dnaAmount): number, 单位 μg
- 转染时长 (duration): number, 单位 h, 范围 4-72
- 转染效率 (efficiency): number, 单位 %, 范围 0-100
- 细胞密度 (cellDensity): number, 单位 cells/well
- 检测方法 (detectionMethod): text
- 实验日期 (date): date

【推荐页面】数据录入 / 历史列表 / 效率分析(ChartView)`,

    flow_cytometry: `你正在为用户生成流式细胞术结果记录应用。

【必备字段】
- 样本编号 (sampleId): text
- 细胞类型 (cellType): text
- 抗体名称 (antibody): text
- 荧光通道 (fluorochrome): select (FITC/PE/APC/PerCP/BV421 等)
- 阳性比例 (positiveRate): number, 单位 %, 范围 0-100
- 细胞总数 (totalCount): number
- 实验日期 (date): date
- 仪器型号 (instrument): text
- 操作者 (operator): text

【推荐页面】数据录入 / 样本列表 / 统计分析`,

    drug_assay: `你正在为用户生成药物活性检测记录应用。

【必备字段】
- 药物名称 (drugName): text
- 药物浓度 (concentration): number, 单位 μM
- 细胞系 (cellLine): text
- 作用时长 (duration): number, 单位 h
- 抑制率 (inhibitionRate): number, 单位 %, 范围 0-100
- IC50 (ic50): number, 单位 μM
- 检测方法 (assayMethod): select (MTT/CCK-8/Resazurin 等)
- 重复次数 (replicates): number
- 实验日期 (date): date
- 操作者 (operator): text

【推荐页面】数据录入 / 历史列表 / 剂量响应曲线(ChartView)`,

    project: `你正在为用户生成细胞生物学课题进度管理应用。

【必备字段】
- 课题名称 (projectName): text
- 负责人 (leader): text
- 起止时间 (period): date
- 当前阶段 (stage): select (立项/进行中/收尾/已完成)
- 关键里程碑 (milestone): textarea
- 相关实验 (relatedExperiments): multiselect
- 经费使用 (budget): number
- 进展备注 (notes): textarea
- 成员 (members): text
- 状态 (status): select

【推荐页面】课题列表 / 进度看板 / 实验关联`,
};

// ============================================================
// 3. 测试用例 (含黄金字段集)
// ============================================================

interface TestCase {
    id: string;
    experimentType: string;
    userInput: string;
    goldFields: string[];  // 每项用|分隔同义词
}

const TEST_CASES: TestCase[] = [
    {
        id: 'T1',
        experimentType: 'passage',
        userInput: '帮我创建一个细胞传代记录应用',
        goldFields: [
            '细胞系|cellLine|cellName',
            '代数|passage|passageNumber',
            '接种密度|seedingDensity|cellDensity',
            '培养基|medium|culture',
            '培养时长|duration|cultureTime',
            '汇合度|confluence|confluency',
            '消化时间|digestionTime|trypsinTime',
            '日期|date',
            '操作者|operator|performer',
            '备注|remarks|notes',
        ],
    },
    {
        id: 'T2',
        experimentType: 'cryopreservation',
        userInput: '帮我创建一个细胞冻存与复苏管理应用',
        goldFields: [
            '细胞系|cellLine',
            '代数|passage',
            '冻存管|vial|tubeId',
            '冻存日期|freezeDate',
            '冻存液|cryoMedium',
            '细胞数|cellCount|cellNumber',
            '液氮|liquidNitrogen|storage',
            '复苏日期|thawDate|recoveryDate',
            '存活率|viability|survivalRate',
            '操作者|operator',
        ],
    },
    {
        id: 'T3',
        experimentType: 'transfection',
        userInput: '帮我创建一个转染实验记录应用',
        goldFields: [
            '细胞系|cellLine',
            '载体|vector|plasmid',
            '转染试剂|reagent|transfectionReagent',
            '试剂用量|reagentAmount',
            'DNA用量|dnaAmount',
            '转染时长|duration|time',
            '转染效率|efficiency',
            '细胞密度|cellDensity',
            '检测方法|detectionMethod',
            '日期|date',
        ],
    },
    {
        id: 'T4',
        experimentType: 'flow_cytometry',
        userInput: '帮我创建一个流式细胞分析结果记录应用',
        goldFields: [
            '样本编号|sampleId',
            '细胞类型|cellType',
            '抗体|antibody',
            '荧光通道|fluorochrome|channel',
            '阳性比例|positiveRate|positivePercent',
            '细胞总数|totalCount',
            '日期|date',
            '仪器|instrument',
            '操作者|operator',
            '备注|notes',
        ],
    },
    {
        id: 'T5',
        experimentType: 'drug_assay',
        userInput: '帮我创建一个药物活性检测记录应用',
        goldFields: [
            '药物|drug|drugName',
            '浓度|concentration',
            '细胞系|cellLine',
            '作用时长|duration',
            '抑制率|inhibition|inhibitionRate',
            'IC50',
            '检测方法|assayMethod',
            '重复次数|replicates',
            '日期|date',
            '操作者|operator',
        ],
    },
    {
        id: 'T6',
        experimentType: 'project',
        userInput: '帮我创建一个细胞生物学课题进度管理应用',
        goldFields: [
            '课题名称|projectName',
            '负责人|leader|owner',
            '起止时间|period|timeline',
            '当前阶段|stage|phase',
            '里程碑|milestone',
            '关联实验|relatedExperiment',
            '经费|funding|budget',
            '备注|notes',
            '成员|member',
            '状态|status',
        ],
    },
];

// ============================================================
// 4. 提示词组装
// ============================================================

function buildMessages(
    userInput: string,
    experimentType: string,
    skipDomainKnowledge: boolean,
): Array<{ role: 'system' | 'user'; content: string }> {
    const parts = [SYSTEM_ROLE_PROMPT];

    if (!skipDomainKnowledge) {
        const dk = DOMAIN_KNOWLEDGE_MAP[experimentType];
        if (dk) parts.push(dk);
    }

    parts.push(JSON_FORMAT_PROMPT);

    return [
        { role: 'system', content: parts.join('\n\n') },
        { role: 'user', content: userInput },
    ];
}

// ============================================================
// 5. LLM调用 (带JSON容错)
// ============================================================

async function callLLM(
    messages: Array<{ role: 'system' | 'user'; content: string }>,
): Promise<any> {
    const completion = await client.chat.completions.create({
        model: MODEL,
        messages,
        temperature: TEMPERATURE,
    });

    const raw = completion.choices[0]?.message?.content || '';

    // 多层容错: 剥离markdown代码块 -> 提取第一个JSON对象 -> parse
    let text = raw.trim();
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();

    // 尝试直接parse
    try {
        return JSON.parse(text);
    } catch { }

    // 提取第一个完整的JSON对象
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
        try {
            return JSON.parse(match[0]);
        } catch (e) {
            console.warn('JSON parse failed after extraction:', e);
        }
    }

    console.error('无法解析LLM返回内容:\n', raw.slice(0, 500));
    return null;
}

// ============================================================
// 6. 评估函数
// ============================================================

interface Metrics {
    fieldCount: number;
    coverageRate: number;
    unitRate: number;
    validationRate: number;
    pageScore: number;
}

function fieldMatchesGold(name: string, label: string, gold: string): boolean {
    const synonyms = gold.toLowerCase().split('|').map(s => s.trim()).filter(Boolean);
    const haystack = ((name || '') + ' ' + (label || '')).toLowerCase();
    return synonyms.some(syn => haystack.includes(syn));
}

function evaluate(config: any, tc: TestCase): Metrics {
    const empty: Metrics = { fieldCount: 0, coverageRate: 0, unitRate: 0, validationRate: 0, pageScore: 0 };
    if (!config || !Array.isArray(config.fields)) return empty;

    const fields: any[] = config.fields;
    const fieldCount = fields.length;

    // 1. 专业字段覆盖率
    let matched = 0;
    for (const gold of tc.goldFields) {
        if (fields.some(f => fieldMatchesGold(f.name, f.label, gold))) matched++;
    }
    const coverageRate = matched / tc.goldFields.length;

    // 2. 单位规范率 (数值字段中带unit的比例)
    const numFields = fields.filter(f => f.type === 'number');
    const withUnit = numFields.filter(f => typeof f.unit === 'string' && f.unit.length > 0);
    const unitRate = numFields.length > 0 ? withUnit.length / numFields.length : 0;

    // 3. 约束完整率
    const withValidation = fields.filter(f =>
        f.validation && typeof f.validation === 'object' && Object.keys(f.validation).length > 0
    );
    const validationRate = fields.length > 0 ? withValidation.length / fields.length : 0;

    // 4. 页面结构评分 (0-3)
    const pages = Array.isArray(config.pages) ? config.pages : [];
    let pageScore = 0;
    if (pages.length >= 1) pageScore += 1;
    if (pages.length >= 3) pageScore += 1;
    const allComponents = pages.flatMap((p: any) => p.components || []);
    if (
        allComponents.includes('DataForm') &&
        allComponents.includes('DataTable') &&
        allComponents.includes('ChartView')
    ) pageScore += 1;

    return { fieldCount, coverageRate, unitRate, validationRate, pageScore };
}

// ============================================================
// 7. 主流程
// ============================================================

interface ResultRow {
    caseId: string;
    experimentType: string;
    group: 'baseline' | 'bioform';
    run: number;
    metrics: Metrics;
    rawConfig: any;
}

async function runBenchmark(): Promise<ResultRow[]> {
    const results: ResultRow[] = [];

    for (const tc of TEST_CASES) {
        console.log(`\n=== ${tc.id} ${tc.experimentType} ===`);

        for (const skipDK of [true, false]) {
            const group = skipDK ? 'baseline' : 'bioform';

            for (let run = 1; run <= REPEAT; run++) {
                process.stdout.write(`  [${group}] run ${run}... `);
                const messages = buildMessages(tc.userInput, tc.experimentType, skipDK);

                try {
                    const config = await callLLM(messages);
                    const metrics = evaluate(config, tc);
                    console.log(
                        `fields=${metrics.fieldCount}, ` +
                        `coverage=${(metrics.coverageRate * 100).toFixed(0)}%, ` +
                        `unit=${(metrics.unitRate * 100).toFixed(0)}%, ` +
                        `val=${(metrics.validationRate * 100).toFixed(0)}%, ` +
                        `page=${metrics.pageScore}/3`
                    );

                    results.push({
                        caseId: tc.id,
                        experimentType: tc.experimentType,
                        group,
                        run,
                        metrics,
                        rawConfig: config,
                    });
                } catch (e: any) {
                    console.error(`ERROR: ${e.message}`);
                }

                await new Promise(r => setTimeout(r, REQUEST_INTERVAL_MS));
            }
        }
    }

    return results;
}

// ============================================================
// 8. 汇总输出
// ============================================================

function avgBy(rows: ResultRow[], key: keyof Metrics): number {
    if (rows.length === 0) return 0;
    return rows.reduce((s, r) => s + (r.metrics[key] as number), 0) / rows.length;
}

function summarize(results: ResultRow[]) {
    console.log('\n\n================================================================');
    console.log('                         实验结果汇总');
    console.log('================================================================\n');

    console.log('【按用例对比】\n');
    console.log('| 用例 | 组别     | 字段数 | 覆盖率 | 单位率 | 约束率 | 页面评分 |');
    console.log('|------|----------|--------|--------|--------|--------|----------|');

    for (const tc of TEST_CASES) {
        for (const group of ['baseline', 'bioform'] as const) {
            const rows = results.filter(r => r.caseId === tc.id && r.group === group);
            if (rows.length === 0) continue;
            const groupLabel = group === 'baseline' ? 'baseline' : 'bioform ';
            console.log(
                `| ${tc.id}   | ${groupLabel} | ${avgBy(rows, 'fieldCount').toFixed(1).padStart(6)} |` +
                ` ${(avgBy(rows, 'coverageRate') * 100).toFixed(1).padStart(5)}% |` +
                ` ${(avgBy(rows, 'unitRate') * 100).toFixed(1).padStart(5)}% |` +
                ` ${(avgBy(rows, 'validationRate') * 100).toFixed(1).padStart(5)}% |` +
                ` ${avgBy(rows, 'pageScore').toFixed(1)}/3    |`
            );
        }
    }

    console.log('\n【总体对比】\n');
    console.log('| 组别     | 平均字段数 | 覆盖率 | 单位率 | 约束率 | 页面评分 |');
    console.log('|----------|------------|--------|--------|--------|----------|');

    for (const group of ['baseline', 'bioform'] as const) {
        const rows = results.filter(r => r.group === group);
        const groupLabel = group === 'baseline' ? 'baseline' : 'bioform ';
        console.log(
            `| ${groupLabel} | ${avgBy(rows, 'fieldCount').toFixed(1).padStart(10)} |` +
            ` ${(avgBy(rows, 'coverageRate') * 100).toFixed(1).padStart(5)}% |` +
            ` ${(avgBy(rows, 'unitRate') * 100).toFixed(1).padStart(5)}% |` +
            ` ${(avgBy(rows, 'validationRate') * 100).toFixed(1).padStart(5)}% |` +
            ` ${avgBy(rows, 'pageScore').toFixed(2)}/3   |`
        );
    }

    // 提升幅度
    const baseRows = results.filter(r => r.group === 'baseline');
    const bioRows = results.filter(r => r.group === 'bioform');
    console.log('\n【提升幅度】');
    console.log(`  字段数:     ${(avgBy(bioRows, 'fieldCount') - avgBy(baseRows, 'fieldCount')).toFixed(1)} (+${((avgBy(bioRows, 'fieldCount') / avgBy(baseRows, 'fieldCount') - 1) * 100).toFixed(0)}%)`);
    console.log(`  覆盖率:     +${((avgBy(bioRows, 'coverageRate') - avgBy(baseRows, 'coverageRate')) * 100).toFixed(1)} 百分点`);
    console.log(`  单位率:     +${((avgBy(bioRows, 'unitRate') - avgBy(baseRows, 'unitRate')) * 100).toFixed(1)} 百分点`);
    console.log(`  约束率:     +${((avgBy(bioRows, 'validationRate') - avgBy(baseRows, 'validationRate')) * 100).toFixed(1)} 百分点`);
    console.log(`  页面评分:   +${(avgBy(bioRows, 'pageScore') - avgBy(baseRows, 'pageScore')).toFixed(2)}`);
}

// ============================================================
// 9. 入口
// ============================================================

(async () => {
    console.log('======================================');
    console.log('  BioForm 领域知识注入对比实验');
    console.log('======================================');
    console.log(`模型: ${MODEL}`);
    console.log(`温度: ${TEMPERATURE}`);
    console.log(`每组重复: ${REPEAT} 次`);
    console.log(`测试用例: ${TEST_CASES.length} 个`);
    console.log(`总调用次数: ${TEST_CASES.length * 2 * REPEAT} 次\n`);

    const results = await runBenchmark();

    // 保存完整结果
    const outDir = path.join(__dirname, 'benchmark_results');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outFile = path.join(outDir, `results_${timestamp}.json`);
    fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
    console.log(`\n完整结果已保存至: ${outFile}`);

    summarize(results);
})();