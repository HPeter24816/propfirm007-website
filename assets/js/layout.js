// layout.js
// This script injects the header and footer into the page.
// It relies on a global variable ROOT_PATH to determine relative links.
// If ROOT_PATH is not defined, it defaults to './'.

document.addEventListener('DOMContentLoaded', () => {
    // 1. Determine Path Prefix (Root vs Pages)
    const isPagesDir = window.location.pathname.includes('/pages/');
    const basePath = isPagesDir ? '..' : '.';
    
    // Determine if we are on the homepage to optimize anchor links
    // If on homepage, use pure hash links (e.g. #faq) to trigger smooth scroll
    // If on other pages, use full path (e.g. ../index.html#faq)
    const path = window.location.pathname;
    const isHome = !isPagesDir && (path.endsWith('index.html') || path.endsWith('/') || path.length < 2);
    const homeAnchorPrefix = isHome ? '' : `${basePath}/index.html`;
    
    // 2. Define Header HTML (Using {BASE} placeholder)
    const headerHTML = `
    <header class="header">
        <div class="header__container">
            <a href="${basePath}/index.html" class="header__logo">
                Futures Propfirm <span class="header__logo-highlight">中文社区</span>
            </a>
            <nav class="header__nav">
                <ul class="header__menu">
                    <li class="header__menu-item"><a href="${basePath}/index.html" class="header__link">首页</a></li>
                    
                    <!-- 规则介绍 -->
                    <li class="header__menu-item">
                        <a href="#" class="header__link">平台规则</a>
                        <div class="header__dropdown">
                            <div class="header__dropdown-inner">
                                <a href="${basePath}/pages/lucid-rule.html" class="dropdown-link">Lucid</a>
                                <a href="${basePath}/pages/topone-rule.html" class="dropdown-link">Topone futures</a>
                                <a href="${basePath}/pages/Alpha-rule.html" class="dropdown-link">Alpha Futures</a>
                                <a href="${basePath}/pages/FN-rule.html" class="dropdown-link">FundedNext</a>
                                <a href="${basePath}/pages/Purdia-rule.html" class="dropdown-link">Purdia</a>
                            </div>
                        </div>
                    </li>

                    <!-- 教程 -->
                    <li class="header__menu-item">
                        <a href="#" class="header__link">攻略</a>
                        <div class="header__dropdown">
                            <div class="header__dropdown-inner">
                                <a href="${basePath}/pages/propfirm-introduction.html" class="dropdown-link">Propfirm规则攻略</a>
                                <a href="${basePath}/pages/FAQ.html" class="dropdown-link">Propfirm常见问题</a>
                                <a href="${basePath}/pages/New.html" class="dropdown-link">保姆级新手攻略</a>
                                <a href="${basePath}/pages/international_card.html" class="dropdown-link">国际支付卡办理攻略</a>
                                <a href="${basePath}/pages/U_card.html" class="dropdown-link">U卡办理攻略</a>
                                <a href="${basePath}/pages/sign_up_platform.html" class="dropdown-link">考试号购买攻略</a>
                            </div>
                        </div>
                    </li>

                    <!-- 出金教程 -->
                    <li class="header__menu-item">
                        <a href="#" class="header__link">出金教程</a>
                        <div class="header__dropdown">
                            <div class="header__dropdown-inner">
                                <a href="${basePath}/pages/W-8_BEN.html" class="dropdown-link">W-8 BEN 填写教程</a>
                                <a href="${basePath}/pages/workmarket_sign_up.html" class="dropdown-link">WorkMarket 注册教程</a>
                                <a href="${basePath}/pages/wise_sign_up.html" class="dropdown-link">Wise 注册教程</a>
                                <a href="${basePath}/pages/wise_profile.html" class="dropdown-link">Wise 账户信息下载</a>
                                <a href="${basePath}/pages/wise_payout.html" class="dropdown-link">Wise 出金教程</a>
                                <a href="${basePath}/pages/wise_problems.html" class="dropdown-link">Wise 常见问题</a>
                            </div>
                        </div>
                    </li>
                    
                    <!-- 资源 -->
                    <li class="header__menu-item">
                        <a href="${basePath}/pages/studying-resource.html" class="header__link">资源</a>
                        <div class="header__dropdown">
                            <div class="header__dropdown-inner">
                                <a href="${basePath}/pages/up.html" class="dropdown-link">推荐博主</a>
                                <a href="${basePath}/pages/book.html" class="dropdown-link">书籍清单</a>
                                <a href="${basePath}/pages/studying-resource.html" class="dropdown-link">价格行为资源</a>
                                <a href="https://wcnrxdhlalep.feishu.cn/base/AIuQbo6skabINvsuDT3c9wWRnvg?from=from_copylink" class="dropdown-link" target="_blank">复盘模板</a>
                                <a href="https://ima.qq.com/wiki/?shareId=e94ad0077a20013e1dccbb6e5a3803fc4d8a901cc5eab950ffd67c4af502c052" class="dropdown-link" target="_blank">ima国内核心课AI知识库</a>
                                <a href="https://notebooklm.google.com/notebook/561b4504-eb4e-4fdb-a177-ecbd3967bb0c" class="dropdown-link" target="_blank">PA核心课AI知识库</a>
                            </div>
                        </div>
                    </li>

                    <!-- 常见问题 -->
                    <li class="header__menu-item">
                        <a href="${homeAnchorPrefix}#faq" class="header__link">常见问题</a>
                        <div class="header__dropdown">
                            <div class="header__dropdown-inner">
                                <a href="${basePath}/pages/propfirm_new.html" class="dropdown-link" target="_blank">什么是 Futures 自营公司？</a>
                                <a href="${homeAnchorPrefix}#faq-2" class="dropdown-link">新手该如何开始？</a>
                                <a href="${homeAnchorPrefix}#faq-3" class="dropdown-link">关于交易技术</a>
                                <a href="${homeAnchorPrefix}#faq-4" class="dropdown-link">如何使用折扣码？</a>
                                <a href="${homeAnchorPrefix}#faq-5" class="dropdown-link">交易平台选择</a>
                            </div>
                        </div>
                    </li>

                    <!-- 交易工具 -->
                    <li class="header__menu-item">
                        <a href="#" class="header__link">交易工具</a>
                        <div class="header__dropdown">
                            <div class="header__dropdown-inner">
                                <a href="${basePath}/pages/trading_tool.html" class="dropdown-link">交易日志</a>
                                <a href="https://notebooklm.google.com/notebook/561b4504-eb4e-4fdb-a177-ecbd3967bb0c" class="dropdown-link" target="_blank">PA核心课AI知识库</a>
                                <a href="https://ima.qq.com/wiki/?shareId=e94ad0077a20013e1dccbb6e5a3803fc4d8a901cc5eab950ffd67c4af502c052" class="dropdown-link" target="_blank">ima国内核心课AI知识库</a>
                            </div>
                        </div>
                    </li>

                    <!-- 社区 -->
                    <li class="header__menu-item">
                        <a href="${basePath}/pages/communicate.html" class="header__link">社区</a>
                    </li>
                    
                    <!-- 联系 -->
                    <li class="header__menu-item">
                        <a href="${basePath}/pages/contact.html" class="header__cta">联系方式</a>
                    </li>
                </ul>
            </nav>
            <button class="header__toggle" aria-label="切换菜单">
                <span class="header__toggle-bar"></span>
                <span class="header__toggle-bar"></span>
                <span class="header__toggle-bar"></span>
            </button>
        </div>
    </header>
    `;

    // 3. Define Footer HTML
    const footerHTML = `
    <footer class="footer">
        <div class="container">
            <div class="footer__cta" id="footer-contact">
                <h3>折扣提醒、交流交易经验</h3>
                <a href="${basePath}/pages/contact.html" class="button button--primary">联系方式</a>
            </div>
            <div class="footer__links">
                <!-- Add footer links here if needed -->
            </div>
            <div class="footer__copyright">
                &copy; 2025 Futures Propfirm 中文社区. 
            </div>
        </div>
    </footer>
    `;

    // 4. Inject Header (Prepend to body)
    document.body.insertAdjacentHTML('afterbegin', headerHTML);

    // 5. Inject Footer (Append to body, or replace existing footer placeholder)
    // If page already has a footer, we might want to replace it or append after main
    const existingFooter = document.querySelector('footer');
    if (existingFooter) {
        existingFooter.remove();
    }
    document.body.insertAdjacentHTML('beforeend', footerHTML);

    // 6. Initialize Mobile Menu Logic
    const headerToggle = document.querySelector('.header__toggle');
    const headerNav = document.querySelector('.header__nav');
    const body = document.body;
    
    if (headerToggle && headerNav) {
        headerToggle.addEventListener('click', () => {
            const isActive = headerNav.classList.toggle('active');
            headerToggle.classList.toggle('active');
            
            // Prevent scrolling when menu is open
            if (isActive) {
                body.style.overflow = 'hidden';
            } else {
                body.style.overflow = '';
            }
        });

        // Close menu when clicking a link
        const navLinks = document.querySelectorAll('.header__link, .header__cta, .dropdown-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                headerNav.classList.remove('active');
                headerToggle.classList.remove('active');
                body.style.overflow = '';
            });
        });
    }
});
