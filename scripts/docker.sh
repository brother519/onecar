#!/bin/bash

# OneCar Docker 管理脚本
# 用于管理开发和生产环境的 Docker 容器

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

# 检查 Docker 环境
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi

    log_success "Docker 环境检查通过"
}

# 获取 Docker Compose 命令
get_compose_cmd() {
    if docker compose version &> /dev/null; then
        echo "docker compose"
    else
        echo "docker-compose"
    fi
}

# 构建镜像
build_images() {
    local env=${1:-production}
    local compose_cmd=$(get_compose_cmd)
    
    log_info "构建 $env 环境镜像..."
    
    if [ "$env" = "development" ]; then
        $compose_cmd -f docker-compose.dev.yml build
    else
        $compose_cmd -f docker-compose.yml build
    fi
    
    log_success "$env 环境镜像构建完成"
}

# 启动服务
start_services() {
    local env=${1:-production}
    local compose_cmd=$(get_compose_cmd)
    
    log_info "启动 $env 环境服务..."
    
    if [ "$env" = "development" ]; then
        $compose_cmd -f docker-compose.dev.yml up -d
    else
        $compose_cmd -f docker-compose.yml up -d
    fi
    
    log_success "$env 环境服务启动成功"
    show_services $env
}

# 停止服务
stop_services() {
    local env=${1:-production}
    local compose_cmd=$(get_compose_cmd)
    
    log_info "停止 $env 环境服务..."
    
    if [ "$env" = "development" ]; then
        $compose_cmd -f docker-compose.dev.yml down
    else
        $compose_cmd -f docker-compose.yml down
    fi
    
    log_success "$env 环境服务已停止"
}

# 重启服务
restart_services() {
    local env=${1:-production}
    
    log_info "重启 $env 环境服务..."
    stop_services $env
    sleep 2
    start_services $env
}

# 显示服务状态
show_services() {
    local env=${1:-production}
    local compose_cmd=$(get_compose_cmd)
    
    log_info "$env 环境服务状态:"
    
    if [ "$env" = "development" ]; then
        $compose_cmd -f docker-compose.dev.yml ps
    else
        $compose_cmd -f docker-compose.yml ps
    fi
}

# 查看日志
show_logs() {
    local env=${1:-production}
    local service=${2:-}
    local lines=${3:-100}
    local compose_cmd=$(get_compose_cmd)
    
    log_info "显示 $env 环境日志..."
    
    if [ "$env" = "development" ]; then
        if [ -n "$service" ]; then
            $compose_cmd -f docker-compose.dev.yml logs --tail=$lines -f $service
        else
            $compose_cmd -f docker-compose.dev.yml logs --tail=$lines -f
        fi
    else
        if [ -n "$service" ]; then
            $compose_cmd -f docker-compose.yml logs --tail=$lines -f $service
        else
            $compose_cmd -f docker-compose.yml logs --tail=$lines -f
        fi
    fi
}

# 执行命令
exec_command() {
    local env=${1:-production}
    local service=$2
    local command=$3
    local compose_cmd=$(get_compose_cmd)
    
    if [ -z "$service" ] || [ -z "$command" ]; then
        log_error "请指定服务名和命令"
        return 1
    fi
    
    log_info "在 $service 服务中执行: $command"
    
    if [ "$env" = "development" ]; then
        $compose_cmd -f docker-compose.dev.yml exec $service $command
    else
        $compose_cmd -f docker-compose.yml exec $service $command
    fi
}

# 清理资源
cleanup() {
    local env=${1:-all}
    local compose_cmd=$(get_compose_cmd)
    
    log_info "清理 Docker 资源..."
    
    if [ "$env" = "all" ] || [ "$env" = "production" ]; then
        $compose_cmd -f docker-compose.yml down -v --remove-orphans
    fi
    
    if [ "$env" = "all" ] || [ "$env" = "development" ]; then
        $compose_cmd -f docker-compose.dev.yml down -v --remove-orphans
    fi
    
    # 清理未使用的镜像和容器
    docker system prune -f
    
    log_success "Docker 资源清理完成"
}

# 备份数据
backup_data() {
    local backup_dir="./backups/$(date +%Y%m%d_%H%M%S)"
    
    log_info "备份数据到 $backup_dir..."
    
    mkdir -p $backup_dir
    
    # 备份上传文件
    if [ -d "./backend/uploads" ]; then
        cp -r ./backend/uploads $backup_dir/
        log_success "上传文件备份完成"
    fi
    
    # 备份日志
    if [ -d "./logs" ]; then
        cp -r ./logs $backup_dir/
        log_success "日志文件备份完成"
    fi
    
    # 备份数据库（如果有）
    # 这里可以添加数据库备份逻辑
    
    log_success "数据备份完成: $backup_dir"
}

# 健康检查
health_check() {
    local env=${1:-production}
    
    log_info "执行 $env 环境健康检查..."
    
    # 检查服务状态
    show_services $env
    
    # 检查端口
    if [ "$env" = "production" ]; then
        log_info "检查生产环境端口..."
        curl -f http://localhost/api/health || log_warning "生产环境健康检查失败"
    else
        log_info "检查开发环境端口..."
        curl -f http://localhost:3001/api/health || log_warning "后端健康检查失败"
        curl -f http://localhost:3000 || log_warning "前端健康检查失败"
    fi
}

# 显示帮助信息
show_help() {
    echo -e "${BLUE}OneCar Docker 管理工具${NC}"
    echo ""
    echo "使用方法:"
    echo "  ./docker.sh [command] [environment] [options]"
    echo ""
    echo "环境:"
    echo "  development  - 开发环境"
    echo "  production   - 生产环境 (默认)"
    echo ""
    echo "命令:"
    echo "  build [env]                - 构建镜像"
    echo "  start [env]                - 启动服务"
    echo "  stop [env]                 - 停止服务"
    echo "  restart [env]              - 重启服务"
    echo "  status [env]               - 显示服务状态"
    echo "  logs [env] [service] [lines] - 查看日志"
    echo "  exec [env] [service] [cmd] - 执行命令"
    echo "  cleanup [env|all]          - 清理资源"
    echo "  backup                     - 备份数据"
    echo "  health [env]               - 健康检查"
    echo "  help                       - 显示帮助信息"
    echo ""
    echo "示例:"
    echo "  ./docker.sh build development     # 构建开发环境镜像"
    echo "  ./docker.sh start production      # 启动生产环境"
    echo "  ./docker.sh logs dev backend 50   # 查看开发环境后端日志"
    echo "  ./docker.sh exec dev backend bash # 进入开发环境后端容器"
    echo "  ./docker.sh cleanup all           # 清理所有资源"
}

# 主函数
main() {
    local command=${1:-help}
    local env=${2:-production}
    
    # 检查 Docker 环境
    check_docker
    
    case $command in
        "build")
            build_images $env
            ;;
        "start")
            start_services $env
            ;;
        "stop")
            stop_services $env
            ;;
        "restart")
            restart_services $env
            ;;
        "status")
            show_services $env
            ;;
        "logs")
            show_logs $env $3 $4
            ;;
        "exec")
            exec_command $env $3 "${@:4}"
            ;;
        "cleanup")
            cleanup $env
            ;;
        "backup")
            backup_data
            ;;
        "health")
            health_check $env
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
if [ ! -f "docker-compose.yml" ]; then
    log_error "请在项目根目录下运行此脚本"
    exit 1
fi

# 运行主函数
main "$@"