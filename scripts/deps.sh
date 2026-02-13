#!/bin/bash

# OneCar 依赖管理脚本
# 管理前后端依赖的安装、更新和清理

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查依赖状态
check_dependency_status() {
    local dir=$1
    local name=$2
    
    if [ -d "$dir/node_modules" ]; then
        local package_count=$(find "$dir/node_modules" -maxdepth 1 -type d | wc -l)
        log_success "$name 依赖已安装 ($((package_count - 1)) 个包)"
        return 0
    else
        log_warning "$name 依赖未安装"
        return 1
    fi
}

# 安装前端依赖
install_frontend_deps() {
    log_info "安装前端依赖..."
    
    if [ ! -d "frontend" ]; then
        log_error "前端目录不存在"
        return 1
    fi
    
    cd frontend
    
    # 检查 package.json
    if [ ! -f "package.json" ]; then
        log_error "前端 package.json 不存在"
        cd ..
        return 1
    fi
    
    # 检查 npm 缓存
    log_info "检查 npm 缓存..."
    npm cache verify
    
    # 安装依赖
    if [ -f "package-lock.json" ]; then
        log_info "使用 npm ci 进行清洁安装..."
        npm ci
    else
        log_info "使用 npm install 安装依赖..."
        npm install
    fi
    
    # 验证关键依赖
    local critical_deps=("react" "react-dom" "vite" "antd" "@types/react")
    for dep in "${critical_deps[@]}"; do
        if npm list $dep >/dev/null 2>&1; then
            log_success "关键依赖 $dep 已安装"
        else
            log_warning "关键依赖 $dep 可能未正确安装"
        fi
    done
    
    cd ..
    log_success "前端依赖安装完成"
}

# 安装后端依赖
install_backend_deps() {
    log_info "安装后端依赖..."
    
    if [ ! -d "backend" ]; then
        log_error "后端目录不存在"
        return 1
    fi
    
    cd backend
    
    # 检查 package.json
    if [ ! -f "package.json" ]; then
        log_error "后端 package.json 不存在"
        cd ..
        return 1
    fi
    
    # 检查 npm 缓存
    log_info "检查 npm 缓存..."
    npm cache verify
    
    # 安装依赖
    if [ -f "package-lock.json" ]; then
        log_info "使用 npm ci 进行清洁安装..."
        npm ci
    else
        log_info "使用 npm install 安装依赖..."
        npm install
    fi
    
    # 验证关键依赖
    local critical_deps=("express" "cors" "helmet" "dotenv" "nodemon")
    for dep in "${critical_deps[@]}"; do
        if npm list $dep >/dev/null 2>&1; then
            log_success "关键依赖 $dep 已安装"
        else
            log_warning "关键依赖 $dep 可能未正确安装"
        fi
    done
    
    cd ..
    log_success "后端依赖安装完成"
}

# 更新依赖
update_dependencies() {
    local component=$1
    
    case $component in
        "frontend")
            log_info "更新前端依赖..."
            cd frontend
            npm update
            npm audit fix
            cd ..
            log_success "前端依赖更新完成"
            ;;
        "backend")
            log_info "更新后端依赖..."
            cd backend
            npm update
            npm audit fix
            cd ..
            log_success "后端依赖更新完成"
            ;;
        "all")
            update_dependencies "frontend"
            update_dependencies "backend"
            ;;
        *)
            log_error "未知组件: $component，支持的组件: frontend, backend, all"
            return 1
            ;;
    esac
}

# 检查安全漏洞
audit_dependencies() {
    log_info "检查依赖安全性..."
    
    local issues=0
    
    # 检查前端
    if [ -d "frontend/node_modules" ]; then
        log_info "审计前端依赖..."
        cd frontend
        if ! npm audit --audit-level=moderate; then
            issues=$((issues + 1))
            log_warning "前端依赖存在安全问题"
        else
            log_success "前端依赖安全检查通过"
        fi
        cd ..
    fi
    
    # 检查后端
    if [ -d "backend/node_modules" ]; then
        log_info "审计后端依赖..."
        cd backend
        if ! npm audit --audit-level=moderate; then
            issues=$((issues + 1))
            log_warning "后端依赖存在安全问题"
        else
            log_success "后端依赖安全检查通过"
        fi
        cd ..
    fi
    
    if [ $issues -gt 0 ]; then
        log_warning "发现 $issues 个组件存在安全问题，建议运行 'npm audit fix'"
    fi
}

# 清理依赖
clean_dependencies() {
    local component=$1
    
    case $component in
        "frontend")
            log_info "清理前端依赖..."
            if [ -d "frontend/node_modules" ]; then
                rm -rf frontend/node_modules
                log_success "前端 node_modules 已清理"
            fi
            if [ -f "frontend/package-lock.json" ]; then
                rm -f frontend/package-lock.json
                log_success "前端 package-lock.json 已清理"
            fi
            ;;
        "backend")
            log_info "清理后端依赖..."
            if [ -d "backend/node_modules" ]; then
                rm -rf backend/node_modules
                log_success "后端 node_modules 已清理"
            fi
            if [ -f "backend/package-lock.json" ]; then
                rm -f backend/package-lock.json
                log_success "后端 package-lock.json 已清理"
            fi
            ;;
        "all")
            clean_dependencies "frontend"
            clean_dependencies "backend"
            ;;
        *)
            log_error "未知组件: $component，支持的组件: frontend, backend, all"
            return 1
            ;;
    esac
}

# 显示依赖信息
show_dependency_info() {
    log_info "依赖信息汇总:"
    echo ""
    
    # 前端依赖信息
    if [ -d "frontend" ]; then
        echo -e "${BLUE}前端依赖:${NC}"
        if check_dependency_status "frontend" "前端"; then
            cd frontend
            echo "  核心依赖版本:"
            echo "  - React: $(npm list react --depth=0 2>/dev/null | grep react@ | cut -d'@' -f2 || echo '未安装')"
            echo "  - Vite: $(npm list vite --depth=0 2>/dev/null | grep vite@ | cut -d'@' -f2 || echo '未安装')"
            echo "  - Ant Design: $(npm list antd --depth=0 2>/dev/null | grep antd@ | cut -d'@' -f2 || echo '未安装')"
            echo "  - TypeScript: $(npm list typescript --depth=0 2>/dev/null | grep typescript@ | cut -d'@' -f2 || echo '未安装')"
            cd ..
        fi
        echo ""
    fi
    
    # 后端依赖信息
    if [ -d "backend" ]; then
        echo -e "${BLUE}后端依赖:${NC}"
        if check_dependency_status "backend" "后端"; then
            cd backend
            echo "  核心依赖版本:"
            echo "  - Express: $(npm list express --depth=0 2>/dev/null | grep express@ | cut -d'@' -f2 || echo '未安装')"
            echo "  - Node.js: $(node -v)"
            echo "  - Nodemon: $(npm list nodemon --depth=0 2>/dev/null | grep nodemon@ | cut -d'@' -f2 || echo '未安装')"
            cd ..
        fi
        echo ""
    fi
}

# 生成依赖报告
generate_dependency_report() {
    log_info "生成依赖报告..."
    
    local report_file="dependency-report.txt"
    
    cat > $report_file << EOF
OneCar 依赖报告
===============
生成时间: $(date)

前端依赖 (frontend/):
EOF
    
    if [ -d "frontend/node_modules" ]; then
        cd frontend
        npm list --depth=0 >> ../$report_file 2>/dev/null || echo "依赖信息获取失败" >> ../$report_file
        cd ..
    else
        echo "前端依赖未安装" >> $report_file
    fi
    
    echo "" >> $report_file
    echo "后端依赖 (backend/):" >> $report_file
    
    if [ -d "backend/node_modules" ]; then
        cd backend
        npm list --depth=0 >> ../$report_file 2>/dev/null || echo "依赖信息获取失败" >> ../$report_file
        cd ..
    else
        echo "后端依赖未安装" >> $report_file
    fi
    
    log_success "依赖报告已生成: $report_file"
}

# 显示帮助信息
show_help() {
    echo -e "${BLUE}OneCar 依赖管理工具${NC}"
    echo ""
    echo "使用方法:"
    echo "  ./deps.sh [command] [component]"
    echo ""
    echo "命令:"
    echo "  install [frontend|backend|all]  - 安装依赖 (默认: all)"
    echo "  update [frontend|backend|all]   - 更新依赖"
    echo "  clean [frontend|backend|all]    - 清理依赖"
    echo "  audit                           - 检查安全漏洞"
    echo "  status                          - 显示依赖状态"
    echo "  report                          - 生成依赖报告"
    echo "  help                            - 显示帮助信息"
    echo ""
    echo "示例:"
    echo "  ./deps.sh install              # 安装所有依赖"
    echo "  ./deps.sh install frontend     # 仅安装前端依赖"
    echo "  ./deps.sh update all           # 更新所有依赖"
    echo "  ./deps.sh clean backend         # 清理后端依赖"
}

# 主函数
main() {
    local command=${1:-install}
    local component=${2:-all}
    
    case $command in
        "install")
            case $component in
                "frontend")
                    install_frontend_deps
                    ;;
                "backend")
                    install_backend_deps
                    ;;
                "all")
                    install_frontend_deps
                    install_backend_deps
                    ;;
                *)
                    log_error "未知组件: $component"
                    show_help
                    exit 1
                    ;;
            esac
            ;;
        "update")
            update_dependencies $component
            ;;
        "clean")
            clean_dependencies $component
            ;;
        "audit")
            audit_dependencies
            ;;
        "status")
            show_dependency_info
            ;;
        "report")
            generate_dependency_report
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            log_error "未知命令: $command"
            show_help
            exit 1
            ;;
    esac
}

# 检查是否在项目根目录
if [ ! -f "README.md" ]; then
    log_error "请在项目根目录下运行此脚本"
    exit 1
fi

# 创建 scripts 目录
mkdir -p scripts

# 运行主函数
main "$@"