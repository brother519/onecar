#!/bin/bash

# OneCar 商品管理系统 - 项目启动脚本
# 使用方法: ./start.sh [frontend|backend|all]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# 检查依赖
check_dependencies() {
    log_info "检查系统依赖..."
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装，请先安装 Node.js (>=16.0.0)"
        exit 1
    fi
    
    local node_version=$(node -v | cut -d'v' -f2)
    local required_version="16.0.0"
    
    if [ "$(printf '%s\n' "$required_version" "$node_version" | sort -V | head -n1)" != "$required_version" ]; then
        log_error "Node.js 版本过低，需要 >= 16.0.0，当前版本: $node_version"
        exit 1
    fi
    
    log_success "Node.js 版本检查通过: $node_version"
    
    # 检查 npm
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装"
        exit 1
    fi
    
    log_success "npm 检查通过: $(npm -v)"
}

# 安装前端依赖
install_frontend_deps() {
    log_info "安装前端依赖..."
    cd frontend
    
    if [ ! -d "node_modules" ]; then
        npm install
        log_success "前端依赖安装完成"
    else
        log_info "前端依赖已存在，跳过安装"
    fi
    
    cd ..
}

# 安装后端依赖
install_backend_deps() {
    log_info "安装后端依赖..."
    cd backend
    
    if [ ! -d "node_modules" ]; then
        npm install
        log_success "后端依赖安装完成"
    else
        log_info "后端依赖已存在，跳过安装"
    fi
    
    cd ..
}

# 启动前端服务
start_frontend() {
    log_info "启动前端开发服务器..."
    cd frontend
    npm run dev &
    FRONTEND_PID=$!
    log_success "前端服务已启动，PID: $FRONTEND_PID"
    echo $FRONTEND_PID > ../frontend.pid
    cd ..
}

# 启动后端服务
start_backend() {
    log_info "启动后端API服务器..."
    cd backend
    npm run dev &
    BACKEND_PID=$!
    log_success "后端服务已启动，PID: $BACKEND_PID"
    echo $BACKEND_PID > ../backend.pid
    cd ..
}

# 停止服务
stop_services() {
    log_info "停止服务..."
    
    if [ -f "frontend.pid" ]; then
        local frontend_pid=$(cat frontend.pid)
        if ps -p $frontend_pid > /dev/null; then
            kill $frontend_pid
            log_success "前端服务已停止"
        fi
        rm -f frontend.pid
    fi
    
    if [ -f "backend.pid" ]; then
        local backend_pid=$(cat backend.pid)
        if ps -p $backend_pid > /dev/null; then
            kill $backend_pid
            log_success "后端服务已停止"
        fi
        rm -f backend.pid
    fi
}

# 运行测试
run_tests() {
    log_info "运行测试套件..."
    
    cd frontend
    log_info "运行前端测试..."
    npm test
    
    cd ../backend
    log_info "运行后端测试..."
    npm test
    
    cd ..
    log_success "所有测试完成"
}

# 构建项目
build_project() {
    log_info "构建项目..."
    
    cd frontend
    log_info "构建前端..."
    npm run build
    log_success "前端构建完成"
    
    cd ..
    log_success "项目构建完成"
}

# 显示服务状态
show_status() {
    log_info "服务状态："
    
    if [ -f "frontend.pid" ]; then
        local frontend_pid=$(cat frontend.pid)
        if ps -p $frontend_pid > /dev/null; then
            log_success "前端服务运行中 (PID: $frontend_pid) - http://localhost:3000"
        else
            log_warning "前端服务未运行"
        fi
    else
        log_warning "前端服务未运行"
    fi
    
    if [ -f "backend.pid" ]; then
        local backend_pid=$(cat backend.pid)
        if ps -p $backend_pid > /dev/null; then
            log_success "后端服务运行中 (PID: $backend_pid) - http://localhost:3001"
        else
            log_warning "后端服务未运行"
        fi
    else
        log_warning "后端服务未运行"
    fi
}

# 显示帮助信息
show_help() {
    echo -e "${BLUE}OneCar 商品管理系统 - 启动脚本${NC}"
    echo ""
    echo "使用方法:"
    echo "  ./start.sh [command]"
    echo ""
    echo "命令:"
    echo "  frontend    - 仅启动前端服务"
    echo "  backend     - 仅启动后端服务"
    echo "  all         - 启动前后端服务 (默认)"
    echo "  stop        - 停止所有服务"
    echo "  status      - 显示服务状态"
    echo "  test        - 运行测试"
    echo "  build       - 构建项目"
    echo "  clean       - 清理项目"
    echo "  help        - 显示帮助信息"
    echo ""
    echo "示例:"
    echo "  ./start.sh              # 启动所有服务"
    echo "  ./start.sh frontend     # 仅启动前端"
    echo "  ./start.sh stop         # 停止所有服务"
}

# 清理项目
clean_project() {
    log_info "清理项目..."
    
    stop_services
    
    if [ -d "frontend/node_modules" ]; then
        rm -rf frontend/node_modules
        log_success "清理前端 node_modules"
    fi
    
    if [ -d "backend/node_modules" ]; then
        rm -rf backend/node_modules
        log_success "清理后端 node_modules"
    fi
    
    if [ -d "frontend/dist" ]; then
        rm -rf frontend/dist
        log_success "清理前端构建文件"
    fi
    
    rm -f *.pid
    log_success "项目清理完成"
}

# 主函数
main() {
    local command=${1:-all}
    
    case $command in
        "frontend")
            check_dependencies
            install_frontend_deps
            start_frontend
            show_status
            ;;
        "backend")
            check_dependencies
            install_backend_deps
            start_backend
            show_status
            ;;
        "all")
            check_dependencies
            install_frontend_deps
            install_backend_deps
            start_backend
            sleep 2
            start_frontend
            show_status
            log_info "所有服务已启动，按 Ctrl+C 停止服务"
            
            # 等待用户中断
            trap stop_services INT
            wait
            ;;
        "stop")
            stop_services
            ;;
        "status")
            show_status
            ;;
        "test")
            check_dependencies
            install_frontend_deps
            install_backend_deps
            run_tests
            ;;
        "build")
            check_dependencies
            install_frontend_deps
            build_project
            ;;
        "clean")
            clean_project
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
if [ ! -f "README.md" ] || [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    log_error "请在项目根目录下运行此脚本"
    exit 1
fi

# 运行主函数
main "$@"