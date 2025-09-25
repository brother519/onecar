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
    
    # 创建日志目录
    mkdir -p logs
    
    cd frontend
    
    # 启动服务并重定向日志
    npm run dev > ../logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    
    log_success "前端服务已启动，PID: $FRONTEND_PID"
    echo $FRONTEND_PID > ../frontend.pid
    
    cd ..
    
    # 等待服务启动
    log_info "等待前端服务启动..."
    local count=0
    while [ $count -lt 30 ]; do
        if check_service_health "frontend" "http://localhost:3000" 2; then
            log_success "前端服务已就绪"
            return 0
        fi
        sleep 2
        count=$((count + 1))
        printf "."
    done
    
    echo ""
    log_warning "前端服务启动超时，请检查日志: logs/frontend.log"
}

# 启动后端服务
start_backend() {
    log_info "启动后端API服务器..."
    
    # 创建日志目录
    mkdir -p logs
    mkdir -p backend/uploads
    
    cd backend
    
    # 启动服务并重定向日志
    npm run dev > ../logs/backend.log 2>&1 &
    BACKEND_PID=$!
    
    log_success "后端服务已启动，PID: $BACKEND_PID"
    echo $BACKEND_PID > ../backend.pid
    
    cd ..
    
    # 等待服务启动
    log_info "等待后端服务启动..."
    local count=0
    while [ $count -lt 30 ]; do
        if check_service_health "backend" "http://localhost:3001/api/health" 2; then
            log_success "后端服务已就绪"
            return 0
        fi
        sleep 2
        count=$((count + 1))
        printf "."
    done
    
    echo ""
    log_warning "后端服务启动超时，请检查日志: logs/backend.log"
}

# 停止服务
stop_services() {
    log_info "停止服务..."
    
    if [ -f "frontend.pid" ]; then
        local frontend_pid=$(cat frontend.pid)
        if ps -p $frontend_pid > /dev/null; then
            log_info "停止前端服务 (PID: $frontend_pid)..."
            kill -TERM $frontend_pid
            
            # 等待进程优雅关闭
            local count=0
            while ps -p $frontend_pid > /dev/null && [ $count -lt 10 ]; do
                sleep 1
                count=$((count + 1))
            done
            
            # 如果进程仍然存在，强制杀死
            if ps -p $frontend_pid > /dev/null; then
                log_warning "强制停止前端服务..."
                kill -KILL $frontend_pid
            fi
            
            log_success "前端服务已停止"
        fi
        rm -f frontend.pid
    fi
    
    if [ -f "backend.pid" ]; then
        local backend_pid=$(cat backend.pid)
        if ps -p $backend_pid > /dev/null; then
            log_info "停止后端服务 (PID: $backend_pid)..."
            kill -TERM $backend_pid
            
            # 等待进程优雅关闭
            local count=0
            while ps -p $backend_pid > /dev/null && [ $count -lt 10 ]; do
                sleep 1
                count=$((count + 1))
            done
            
            # 如果进程仍然存在，强制杀死
            if ps -p $backend_pid > /dev/null; then
                log_warning "强制停止后端服务..."
                kill -KILL $backend_pid
            fi
            
            log_success "后端服务已停止"
        fi
        rm -f backend.pid
    fi
    
    # 清理可能的僵尸进程
    pkill -f "vite" 2>/dev/null || true
    pkill -f "nodemon" 2>/dev/null || true
}

# 显示日志
show_logs() {
    local service=${1:-all}
    local lines=${2:-50}
    
    case $service in
        "frontend")
            if [ -f "logs/frontend.log" ]; then
                log_info "前端服务日志 (最后 $lines 行):"
                tail -n $lines logs/frontend.log
            else
                log_warning "前端日志文件不存在"
            fi
            ;;
        "backend")
            if [ -f "logs/backend.log" ]; then
                log_info "后端服务日志 (最后 $lines 行):"
                tail -n $lines logs/backend.log
            else
                log_warning "后端日志文件不存在"
            fi
            ;;
        "all")
            show_logs "backend" $lines
            echo ""
            show_logs "frontend" $lines
            ;;
        *)
            log_error "未知服务: $service，支持的服务: frontend, backend, all"
            ;;
    esac
}

# 服务监控
monitor_services() {
    log_info "开始监控服务...按 Ctrl+C 停止监控"
    
    while true; do
        clear
        echo -e "${BLUE}=== OneCar 服务监控 ($(date)) ===${NC}"
        echo ""
        
        show_status
        
        # 显示系统资源
        echo -e "${BLUE}系统资源:${NC}"
        
        # CPU 使用率
        if command -v top >/dev/null 2>&1; then
            local cpu_usage=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
            printf "  CPU 使用率: %.1f%%\n" "$cpu_usage" 2>/dev/null || echo "  CPU 使用率: 无法获取"
        fi
        
        # 内存使用
        if command -v free >/dev/null 2>&1; then
            free -h | head -2
        elif [[ "$(uname)" == "Darwin" ]]; then
            echo "  内存: $(sysctl -n hw.memsize | awk '{print int($1/1024/1024/1024) "GB 总内存"}')"
        fi
        
        echo ""
        echo "按 Ctrl+C 退出监控"
        sleep 5
    done
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    local issues=0
    
    # 检查后端健康
    if check_service_health "backend" "http://localhost:3001/api/health" 10; then
        log_success "后端 API 服务健康"
    else
        log_error "后端 API 服务不健康"
        issues=$((issues + 1))
    fi
    
    # 检查前端健康
    if check_service_health "frontend" "http://localhost:3000" 10; then
        log_success "前端服务健康"
    else
        log_error "前端服务不健康"
        issues=$((issues + 1))
    fi
    
    # 检查数据目录
    if [ -d "backend/uploads" ]; then
        log_success "上传目录存在"
    else
        log_warning "上传目录不存在，将创建..."
        mkdir -p backend/uploads
    fi
    
    # 检查日志目录
    if [ -d "logs" ]; then
        log_success "日志目录存在"
    else
        log_warning "日志目录不存在，将创建..."
        mkdir -p logs
    fi
    
    if [ $issues -eq 0 ]; then
        log_success "所有服务健康检查通过"
    else
        log_error "发现 $issues 个服务健康问题"
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

# 检查服务健康状态
check_service_health() {
    local service=$1
    local url=$2
    local timeout=${3:-5}
    
    if command -v curl >/dev/null 2>&1; then
        if curl -s --connect-timeout $timeout "$url" >/dev/null 2>&1; then
            return 0
        fi
    elif command -v wget >/dev/null 2>&1; then
        if wget --timeout=$timeout --tries=1 -q -O /dev/null "$url" 2>/dev/null; then
            return 0
        fi
    fi
    return 1
}

# 显示服务状态
show_status() {
    log_info "服务状态："
    echo ""
    
    # 前端服务状态
    printf "%-15s" "前端服务:"
    if [ -f "frontend.pid" ]; then
        local frontend_pid=$(cat frontend.pid)
        if ps -p $frontend_pid > /dev/null; then
            printf "${GREEN}运行中${NC} (PID: $frontend_pid)"
            if check_service_health "frontend" "http://localhost:3000" 3; then
                printf " ${GREEN}[健康]${NC}"
            else
                printf " ${YELLOW}[启动中]${NC}"
            fi
            echo " - http://localhost:3000"
        else
            echo -e "${RED}已停止${NC} (PID文件存在但进程不存在)"
            rm -f frontend.pid
        fi
    else
        echo -e "${RED}未运行${NC}"
    fi
    
    # 后端服务状态
    printf "%-15s" "后端服务:"
    if [ -f "backend.pid" ]; then
        local backend_pid=$(cat backend.pid)
        if ps -p $backend_pid > /dev/null; then
            printf "${GREEN}运行中${NC} (PID: $backend_pid)"
            if check_service_health "backend" "http://localhost:3001/api/health" 3; then
                printf " ${GREEN}[健康]${NC}"
            else
                printf " ${YELLOW}[启动中]${NC}"
            fi
            echo " - http://localhost:3001"
        else
            echo -e "${RED}已停止${NC} (PID文件存在但进程不存在)"
            rm -f backend.pid
        fi
    else
        echo -e "${RED}未运行${NC}"
    fi
    
    echo ""
    
    # 端口占用检查
    if command -v lsof >/dev/null 2>&1; then
        log_info "端口占用情况:"
        for port in 3000 3001; do
            local proc=$(lsof -ti:$port 2>/dev/null)
            if [ -n "$proc" ]; then
                local proc_name=$(ps -p $proc -o comm= 2>/dev/null || echo "未知进程")
                printf "  端口 %-5s: ${GREEN}占用${NC} (PID: $proc, 进程: $proc_name)\n" "$port"
            else
                printf "  端口 %-5s: ${YELLOW}空闲${NC}\n" "$port"
            fi
        done
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
    echo "  restart     - 重启所有服务"
    echo "  status      - 显示服务状态"
    echo "  logs        - 显示服务日志"
    echo "  monitor     - 实时监控服务状态"
    echo "  health      - 执行健康检查"
    echo "  test        - 运行测试"
    echo "  build       - 构建项目"
    echo "  clean       - 清理项目"
    echo "  help        - 显示帮助信息"
    echo ""
    echo "示例:"
    echo "  ./start.sh              # 启动所有服务"
    echo "  ./start.sh frontend     # 仅启动前端"
    echo "  ./start.sh stop         # 停止所有服务"
    echo "  ./start.sh logs backend # 显示后端日志"
    echo "  ./start.sh monitor      # 开启实时监控"
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
        "restart")
            log_info "重启服务..."
            stop_services
            sleep 2
            check_dependencies
            install_frontend_deps
            install_backend_deps
            start_backend
            sleep 2
            start_frontend
            show_status
            ;;
        "logs")
            local service=${2:-all}
            local lines=${3:-50}
            show_logs $service $lines
            ;;
        "monitor")
            monitor_services
            ;;
        "health")
            health_check
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