/**
 * 提示词学习题库数据库管理器
 * Prompt Learning Question Database Manager
 */

class QuestionDatabase {
    constructor() {
        this.data = null;
        this.questions = [];
        this.initialized = false;
    }

    /**
     * 初始化数据库
     * @param {string} jsonUrl - JSON 文件路径
     */
    async init(jsonUrl = 'questions.json') {
        try {
            const response = await fetch(jsonUrl);
            if (!response.ok) {
                throw new Error(`Failed to load database: ${response.status}`);
            }
            this.data = await response.json();
            this.questions = this.data.questions || [];
            this.initialized = true;
            console.log('Database initialized successfully:', this.getInfo());
            return true;
        } catch (error) {
            console.error('Database initialization failed:', error);
            return false;
        }
    }

    /**
     * 获取数据库信息
     */
    getInfo() {
        if (!this.initialized) return null;
        return {
            ...this.data.database,
            loadedQuestions: this.questions.length
        };
    }

    /**
     * 获取所有题目
     */
    getAllQuestions() {
        return [...this.questions];
    }

    /**
     * 按分类获取题目
     * @param {string} category - 分类名称
     */
    getQuestionsByCategory(category) {
        return this.questions.filter(q => q.category === category);
    }

    /**
     * 按难度获取题目
     * @param {string} difficulty - 难度级别 (easy/medium/hard)
     */
    getQuestionsByDifficulty(difficulty) {
        return this.questions.filter(q => q.difficulty === difficulty);
    }

    /**
     * 随机抽取题目
     * @param {number} count - 抽取数量
     * @param {Object} options - 选项 {category, difficulty}
     */
    getRandomQuestions(count = 5, options = {}) {
        let pool = [...this.questions];
        
        // 按分类筛选
        if (options.category) {
            pool = pool.filter(q => q.category === options.category);
        }
        
        // 按难度筛选
        if (options.difficulty) {
            pool = pool.filter(q => q.difficulty === options.difficulty);
        }
        
        // 随机打乱并截取
        const shuffled = pool.sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(count, shuffled.length));
    }

    /**
     * 根据ID获取题目
     * @param {number} id - 题目ID
     */
    getQuestionById(id) {
        return this.questions.find(q => q.id === id);
    }

    /**
     * 获取所有分类
     */
    getCategories() {
        if (!this.data) return [];
        return this.data.database.categories || [];
    }

    /**
     * 获取分类统计
     */
    getCategoryStats() {
        const stats = {};
        this.questions.forEach(q => {
            if (!stats[q.category]) {
                stats[q.category] = { count: 0, difficulties: {} };
            }
            stats[q.category].count++;
            stats[q.category].difficulties[q.difficulty] = 
                (stats[q.category].difficulties[q.difficulty] || 0) + 1;
        });
        return stats;
    }

    /**
     * 验证答案
     * @param {number} questionId - 题目ID
     * @param {number} answerIndex - 用户选择的答案索引
     */
    validateAnswer(questionId, answerIndex) {
        const question = this.getQuestionById(questionId);
        if (!question) return null;
        
        return {
            correct: question.answer === answerIndex,
            correctAnswer: question.answer,
            explanation: question.explanation
        };
    }

    /**
     * 搜索题目
     * @param {string} keyword - 关键词
     */
    searchQuestions(keyword) {
        const lowerKeyword = keyword.toLowerCase();
        return this.questions.filter(q => 
            q.question.toLowerCase().includes(lowerKeyword) ||
            q.category.toLowerCase().includes(lowerKeyword) ||
            q.explanation.toLowerCase().includes(lowerKeyword)
        );
    }

    /**
     * 导出指定分类的题目
     * @param {string} category - 分类名称
     */
    exportCategory(category) {
        const questions = this.getQuestionsByCategory(category);
        return {
            database: {
                name: `${this.data.database.name} - ${category}`,
                version: this.data.database.version,
                totalQuestions: questions.length,
                categories: [category]
            },
            questions: questions
        };
    }

    /**
     * 生成闯关配置
     * @param {Object} config - 配置选项
     */
    generateQuizConfig(config = {}) {
        const {
            questionCount = 5,
            categories = [],
            difficulties = ['easy', 'medium', 'hard'],
            timeLimit = null
        } = config;

        let pool = [...this.questions];
        
        // 筛选分类
        if (categories.length > 0) {
            pool = pool.filter(q => categories.includes(q.category));
        }
        
        // 筛选难度
        pool = pool.filter(q => difficulties.includes(q.difficulty));
        
        // 随机抽取
        const selected = pool.sort(() => Math.random() - 0.5)
                            .slice(0, Math.min(questionCount, pool.length));

        return {
            config: {
                questionCount: selected.length,
                timeLimit,
                categories: [...new Set(selected.map(q => q.category))],
                difficulties: [...new Set(selected.map(q => q.difficulty))]
            },
            questions: selected
        };
    }
}

// 创建全局实例
const questionDB = new QuestionDatabase();

// 导出模块（支持模块化导入）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { QuestionDatabase, questionDB };
}
