#!/bin/bash

# OneCar 环境检查脚本
# 检查系统环境是否满足开发和运行要求

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

# 检查操作系统
check_os() {
    log_info "检查操作系统..."
    
    case "$(uname -s)" in
        Linux*)     MACHINE=Linux;;
        Darwin*)    MACHINE=Mac;;
        CYGWIN*)    MACHINE=Cygwin;;
        MINGW*)     MACHINE=MinGw;;
        *)          MACHINE="UNKNOWN:$(uname -s)"
    esac
    
    log_success "操作系统: $MACHINE"
    
    if [[ "$MACHINE" == "UNKNOWN"* ]]; then
        log_warning "未知操作系统，可能存在兼容性问题"
    fi
}

# 版本比较函数
version_compare() {
    if [[ $1 == $2 ]]; then
        return 0
    fi
    local IFS=.
    local i ver1=($1) ver2=($2)
    # 填充版本号
    for ((i=${#ver1[@]}; i<${#ver2[@]}; i++)); do
        ver1[i]=0
    done
    for ((i=0; i<${#ver1[@]}; i++)); do
        if [[ -z ${ver2[i]} ]]; then
            ver2[i]=0
        fi
        if ((10#${ver1[i]} > 10#${ver2[i]})); then
            return 1
        fi
        if ((10#${ver1[i]} < 10#${ver2[i]})); then
            return 2
        fi
    done
    return 0
}

# 检查 Node.js
check_nodejs() {
    log_info "检查 Node.js..."
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装"
        log_info "请访问 https://nodejs.org 下载并安装 Node.js"
        return 1
    fi
    
    local node_version=$(node -v | sed 's/v//')
    local required_version="16.0.0"
    
    version_compare $node_version $required_version
    case $? in
        0) log_success "Node.js 版本: $node_version (符合要求)" ;;
        1) log_success "Node.js 版本: $node_version (高于要求的 $required_version)" ;;
        2) 
            log_error "Node.js 版本过低: $node_version，需要 >= $required_version"
            return 1
            ;;
    esac
    
    return 0
}

# 检查 npm
check_npm() {
    log_info "检查 npm..."
    
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装"
        return 1
    fi
    
    local npm_version=$(npm -v)
    local required_version="8.0.0"
    
    version_compare $npm_version $required_version
    case $? in
        0) log_success "npm 版本: $npm_version (符合要求)" ;;
        1) log_success "npm 版本: $npm_version (高于要求的 $required_version)" ;;
        2) 
            log_warning "npm 版本较低: $npm_version，建议升级到 >= $required_version"
            log_info "运行 'npm install -g npm@latest' 进行升级"
            ;;
    esac
    
    return 0
}

# 检查端口占用
check_ports() {
    log_info "检查端口占用..."
    
    local ports=(3000 3001)
    local port_issues=0
    
    for port in "${ports[@]}"; do
        if command -v lsof &> /dev/null; then
            if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
                log_warning "端口 $port 已被占用"
                port_issues=$((port_issues + 1))
            else
                log_success "端口 $port 可用"
            fi
        elif command -v netstat &> /dev/null; then
            if netstat -ln | grep ":$port " >/dev/null 2>&1; then
                log_warning "端口 $port 已被占用"
                port_issues=$((port_issues + 1))
            else
                log_success "端口 $port 可用"
            fi
        else
            log_warning "无法检查端口占用情况（缺少 lsof 或 netstat 命令）"
        fi
    done
    
    if [ $port_issues -gt 0 ]; then
        log_warning "发现 $port_issues 个端口被占用，请确保在启动服务前释放这些端口"
    fi
}

# 检查系统资源
check_system_resources() {
    log_info "检查系统资源..."
    
    # 检查内存
    if command -v free &> /dev/null; then
        local total_mem=$(free -m | awk 'NR==2{print $2}')
        if [ $total_mem -lt 2048 ]; then
            log_warning "系统内存较低: ${total_mem}MB，建议至少 2GB"
        else
            log_success "系统内存: ${total_mem}MB"
        fi
    elif [[ "$MACHINE" == "Mac" ]]; then
        local total_mem=$(sysctl -n hw.memsize | awk '{print int($1/1024/1024)}')
        if [ $total_mem -lt 2048 ]; then
            log_warning "系统内存较低: ${total_mem}MB，建议至少 2GB"
        else
            log_success "系统内存: ${total_mem}MB"
        fi
    fi
    
    # 检查磁盘空间
    local available_space=$(df . | tail -1 | awk '{print $4}')
    if [ $available_space -lt 1048576 ]; then # 1GB in KB
        log_warning "磁盘可用空间较低，建议至少保留 1GB 空间"
    else
        log_success "磁盘空间充足"
    fi
}

# 检查必要工具
check_tools() {
    log_info "检查开发工具..."
    
    local tools=("git" "curl")
    local missing_tools=()
    
    for tool in "${tools[@]}"; do
        if command -v $tool &> /dev/null; then
            log_success "$tool 已安装"
        else
            log_warning "$tool 未安装"
            missing_tools+=($tool)
        fi
    done
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        log_info "建议安装以下工具: ${missing_tools[*]}"
    fi
}

# 检查项目结构
check_project_structure() {
    log_info "检查项目结构..."
    
    local required_dirs=("frontend" "backend")
    local required_files=("README.md" "docker-compose.yml")
    
    for dir in "${required_dirs[@]}"; do
        if [ -d "$dir" ]; then
            log_success "目录 $dir 存在"
        else
            log_error "目录 $dir 不存在"
            return 1
        fi
    done
    
    for file in "${required_files[@]}"; do
        if [ -f "$file" ]; then
            log_success "文件 $file 存在"
        else
            log_warning "文件 $file 不存在"
        fi
    done
    
    return 0
}

# 生成环境报告
generate_report() {
    log_info "生成环境检查报告..."
    
    local report_file="environment-report.txt"
    
    cat > $report_file << EOF
OneCar 环境检查报告
==================
生成时间: $(date)
操作系统: $MACHINE
Node.js: $(node -v 2>/dev/null || echo "未安装")
npm: $(npm -v 2>/dev/null || echo "未安装")

项目结构检查:
$(ls -la)

端口状态:
$(if command -v netstat &> /dev/null; then netstat -ln | grep ":300[01] "; else echo "无法检查端口状态"; fi)

系统资源:
$(if command -v free &> /dev/null; then free -h; elif [[ "$MACHINE" == "Mac" ]]; then sysctl hw.memsize; else echo "无法检查系统资源"; fi)
EOF
    
    log_success "环境报告已生成: $report_file"
}

# 主函数
main() {
    echo -e "${BLUE}=== OneCar 环境检查 ===${NC}"
    echo ""
    
    local errors=0
    
    check_os
    
    if ! check_nodejs; then
        errors=$((errors + 1))
    fi
    
    if ! check_npm; then
        errors=$((errors + 1))
    fi
    
    check_ports
    check_system_resources
    check_tools
    
    if ! check_project_structure; then
        errors=$((errors + 1))
    fi
    
    generate_report
    
    echo ""
    if [ $errors -eq 0 ]; then
        log_success "环境检查通过，可以开始开发！"
        return 0
    else
        log_error "发现 $errors 个错误，请修复后重试"
        return 1
    fi
}

# 检查是否在项目根目录
if [ ! -f "README.md" ]; then
    log_error "请在项目根目录下运行此脚本"
    exit 1
fi

# 运行主函数
main "$@"