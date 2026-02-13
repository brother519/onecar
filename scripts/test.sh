#!/bin/bash

# OneCar 测试运行脚本
# 运行前后端测试套件

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

# 检查依赖
check_dependencies() {
    log_info "检查测试依赖..."
    
    # 检查前端依赖
    if [ ! -d "frontend/node_modules" ]; then
        log_error "前端依赖未安装，请先运行 npm install"
        exit 1
    fi
    
    # 检查后端依赖
    if [ ! -d "backend/node_modules" ]; then
        log_error "后端依赖未安装，请先运行 npm install"
        exit 1
    fi
    
    log_success "依赖检查通过"
}

# 运行前端测试
run_frontend_tests() {
    local mode=${1:-run}
    
    log_info "运行前端测试..."
    cd frontend
    
    case $mode in
        "run")
            npm test
            ;;
        "watch")
            npm run test:watch
            ;;
        "coverage")
            npm run test:coverage
            ;;
        "ci")
            npm run test:ci
            ;;
        *)
            log_error "未知的前端测试模式: $mode"
            cd ..
            return 1
            ;;
    esac
    
    local exit_code=$?
    cd ..
    
    if [ $exit_code -eq 0 ]; then
        log_success "前端测试通过"
    else
        log_error "前端测试失败"
        return 1
    fi
}

# 运行后端测试
run_backend_tests() {
    local mode=${1:-run}
    
    log_info "运行后端测试..."
    cd backend
    
    case $mode in
        "run")
            npm test
            ;;
        "watch")
            npm run test:watch
            ;;
        "coverage")
            npm run test:coverage
            ;;
        "ci")
            npm run test:ci
            ;;
        *)
            log_error "未知的后端测试模式: $mode"
            cd ..
            return 1
            ;;
    esac
    
    local exit_code=$?
    cd ..
    
    if [ $exit_code -eq 0 ]; then
        log_success "后端测试通过"
    else
        log_error "后端测试失败"
        return 1
    fi
}

# 运行所有测试
run_all_tests() {
    local mode=${1:-run}
    local failed_tests=()
    
    log_info "运行所有测试套件..."
    
    # 运行后端测试
    if ! run_backend_tests $mode; then
        failed_tests+=("backend")
    fi
    
    # 运行前端测试
    if ! run_frontend_tests $mode; then
        failed_tests+=("frontend")
    fi
    
    # 汇总结果
    if [ ${#failed_tests[@]} -eq 0 ]; then
        log_success "所有测试通过！"
    else
        log_error "以下测试失败: ${failed_tests[*]}"
        return 1
    fi
}

# 生成测试报告
generate_test_report() {
    log_info "生成测试报告..."
    
    local report_dir="./test-reports"
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    
    mkdir -p $report_dir
    
    # 生成前端测试报告
    log_info "生成前端测试报告..."
    cd frontend
    npm run test:coverage > "../$report_dir/frontend-test-$timestamp.log" 2>&1 || true
    
    # 复制覆盖率报告
    if [ -d "coverage" ]; then
        cp -r coverage "../$report_dir/frontend-coverage-$timestamp"
    fi
    cd ..
    
    # 生成后端测试报告
    log_info "生成后端测试报告..."
    cd backend
    npm run test:coverage > "../$report_dir/backend-test-$timestamp.log" 2>&1 || true
    
    # 复制覆盖率报告
    if [ -d "coverage" ]; then
        cp -r coverage "../$report_dir/backend-coverage-$timestamp"
    fi
    cd ..
    
    log_success "测试报告已生成: $report_dir"
}

# 清理测试文件
cleanup_tests() {
    log_info "清理测试文件..."
    
    # 清理前端测试文件
    if [ -d "frontend/coverage" ]; then
        rm -rf frontend/coverage
        log_success "清理前端覆盖率文件"
    fi
    
    # 清理后端测试文件
    if [ -d "backend/coverage" ]; then
        rm -rf backend/coverage
        log_success "清理后端覆盖率文件"
    fi
    
    # 清理测试报告
    if [ -d "test-reports" ]; then
        rm -rf test-reports
        log_success "清理测试报告"
    fi
    
    log_success "测试文件清理完成"
}

# 显示帮助信息
show_help() {
    echo -e "${BLUE}OneCar 测试工具${NC}"
    echo ""
    echo "使用方法:"
    echo "  ./test.sh [command] [mode]"
    echo ""
    echo "命令:"
    echo "  frontend [mode]  - 运行前端测试"
    echo "  backend [mode]   - 运行后端测试"
    echo "  all [mode]       - 运行所有测试 (默认)"
    echo "  report           - 生成测试报告"
    echo "  cleanup          - 清理测试文件"
    echo "  help             - 显示帮助信息"
    echo ""
    echo "测试模式:"
    echo "  run              - 运行一次测试 (默认)"
    echo "  watch            - 监视模式"
    echo "  coverage         - 生成覆盖率报告"
    echo "  ci               - CI 模式"
    echo ""
    echo "示例:"
    echo "  ./test.sh                    # 运行所有测试"
    echo "  ./test.sh frontend coverage  # 运行前端测试并生成覆盖率"
    echo "  ./test.sh backend watch      # 监视模式运行后端测试"
    echo "  ./test.sh report             # 生成测试报告"
}

# 主函数
main() {
    local command=${1:-all}
    local mode=${2:-run}
    
    case $command in
        "frontend")
            check_dependencies
            run_frontend_tests $mode
            ;;
        "backend")
            check_dependencies
            run_backend_tests $mode
            ;;
        "all")
            check_dependencies
            run_all_tests $mode
            ;;
        "report")
            check_dependencies
            generate_test_report
            ;;
        "cleanup")
            cleanup_tests
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