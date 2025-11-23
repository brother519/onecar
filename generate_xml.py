#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
数据库知识体系XMind到XML转换脚本
根据设计文档要求，将思维导图内容转换为结构化XML格式
"""

import xml.etree.ElementTree as ET
from xml.dom import minidom
from datetime import datetime

def create_database_xml():
    """创建完整的数据库知识体系XML文档"""
    
    # 创建根元素
    root = ET.Element('database-knowledge')
    root.set('version', '1.0')
    root.set('created', '2025-11-03')
    root.set('source', 'database-knowledge-xmind')
    
    node_id = 1  # 节点ID计数器
    
    # 第一章：绪论
    chapter1 = ET.SubElement(root, 'chapter')
    chapter1.set('id', f'node_{node_id:03d}')
    chapter1.set('level', '1')
    chapter1.set('title', '绪论')
    chapter1.set('order', '1')
    node_id += 1
    
    # 添加第二章到第十章的占位符
    chapters_info = [
        ('关系模型', 2),
        ('关系代数', 3),
        ('数据库语言SQL', 4),
        ('查询优化', 5),
        ('关系数据库设计理论', 6),
        ('数据库设计', 7),
        ('数据库恢复技术', 8),
        ('并发控制', 9),
        ('完整性约束', 10)
    ]
    
    for chapter_title, order in chapters_info:
        chapter = ET.SubElement(root, 'chapter')
        chapter.set('id', f'node_{node_id:03d}')
        chapter.set('level', '1')
        chapter.set('title', chapter_title)
        chapter.set('order', str(order))
        node_id += 1
        
        # 添加章节注释
        comment = ET.Comment(f' {chapter_title} ')
        root.insert(root._children.index(chapter), comment)
    
    return root

def prettify_xml(elem):
    """格式化XML输出，添加缩进和换行"""
    rough_string = ET.tostring(elem, encoding='utf-8')
    reparsed = minidom.parseString(rough_string)
    return reparsed.toprettyxml(indent="  ", encoding='utf-8').decode('utf-8')

def main():
    """主函数"""
    print("开始生成数据库知识体系XML文档...")
    
    # 创建XML结构
    root = create_database_xml()
    
    # 格式化并输出
    xml_content = prettify_xml(root)
    
    # 写入文件
    output_file = 'database-knowledge-complete.xml'
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(xml_content)
    
    print(f"✓ XML文档已生成: {output_file}")
    print(f"✓ 文档版本: 1.0")
    print(f"✓ 生成时间: 2025-11-03")
    print(f"✓ 编码格式: UTF-8")

if __name__ == '__main__':
    main()
