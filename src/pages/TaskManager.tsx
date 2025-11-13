/**
 * Tom cat
 * 
 * Task Management System - Main Page Component
 * 
 * Core Features:
 * - Task list display and pagination management
 * - Task CRUD operations
 * - Multi-condition search and filtering
 * - Batch operations (delete, status update)
 * - Form modal management
 * - State management and data synchronization
 * 
 * Component Architecture:
 * - SearchFilter: Search filter component
 * - TaskList: Task list component  
 * - TaskForm: Task form modal
 * - FloatingButton: Floating action button
 * 
 * State Management Strategy:
 * - Use React Hooks for local state management
 * - Contains 15 states including task data, UI state, filter conditions
 * - Component communication via callback functions
 * 
 * Performance Optimization:
 * - Use pagination loading to avoid rendering large amounts of data
 * - Reasonably control re-rendering scope
 * 
 * @module TaskManager
 * @author System
 * @since 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { Layout, Typography, message, Modal } from 'antd';
import { 
  Task, 
  TaskFilters, 
  TaskFormData, 
  TaskStatus, 
  Pagination 
} from '../types/task';
import { taskService, MOCK_ASSIGNEES } from '../services/taskService';
import TaskList from '../components/TaskList';
import TaskForm from '../components/TaskForm';
import SearchFilter from '../components/SearchFilter';
import FloatingButton from '../components/FloatingButton';

const { Header, Content } = Layout;
const { Title } = Typography;

/**
 * TaskManager - Task Management Main Component
 * 
 * Main Features:
 * - Task list display and pagination management
 * - Task CRUD operations
 * - Multi-condition search and filtering
 * - Batch operations (delete, status update)
 * - Form modal management
 * - State management and data synchronization
 * 
 * Dependencies: TaskList, TaskForm, SearchFilter, FloatingButton
 * State Management: Use React Hooks for local state management, including task data, UI state, filter conditions, etc.
 * Performance Considerations: Use pagination loading to avoid rendering large amounts of data, reasonably control re-rendering scope
 * 
 * @returns {JSX.Element} Main interface component of task management system
 * @since 1.0.0
 */
const TaskManager: React.FC = () => {
  // ==================== State Management Layer ====================
  // Module Responsibility: Manage all state data of the component, including task data, UI state, filter conditions, etc.
  // Data Flow: Load from API -> Local state -> UI component rendering
  // Key Logic: State changes trigger corresponding side effects and UI updates
  
  /** 
   * Task list data for current page
   * Data Source: taskService.getTaskList API
   * Update Timing: Component initialization, search filter, after CRUD operations
   */
  const [tasks, setTasks] = useState<Task[]>([]);
  
  /** 
   * Global loading state, controls loading indicator display
   * Update Timing: Set to true when API request starts, false when it ends
   */
  const [loading, setLoading] = useState<boolean>(false);
  
  /** 
   * Total number of tasks, used for pagination component calculation
   * Data Source: total field in API response
   */
  const [total, setTotal] = useState<number>(0);
  
  /** 
   * Pagination control information
   * current: Current page number (starts from 1)
   * pageSize: Number of items per page, default 20
   * total: Total number of records, synchronized with total state
   */
  const [pagination, setPagination] = useState<Pagination>({
    current: 1,
    pageSize: 20,
    total: 0
  });

  /** 
   * Task filter conditions collection
   * keyword: Keyword search, supports fuzzy matching of title and description
   * status: Status filter, supports multiple selections
   * priority: Priority filter, supports multiple selections  
   * assignee: Specified assignee filter
   * dateRange: Creation time range filter
   */
  const [filters, setFilters] = useState<TaskFilters>({
    keyword: '',
    status: [],
    priority: [],
    assignee: '',
    dateRange: null
  });

  /** 
   * Task form modal visibility state
   * Controls display/hide of TaskForm component
   */
  const [taskFormVisible, setTaskFormVisible] = useState<boolean>(false);
  
  /** 
   * Currently editing task object
   * null: Create mode
   * Task object: Edit mode, form will be pre-filled with this task's data
   */
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  /** 
   * List of selected task IDs for batch operations
   * Supports multiple selections, synchronized with TaskList component's selection state
   */
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  // ==================== Data Loading Layer ====================
  // Module Responsibility: Handle interaction with backend API, handle asynchronous data loading and error handling
  // Data Flow: API request -> Response data parsing -> State update -> UI update
  // Key Logic: Pagination loading, filter parameter passing, error handling and user feedback
  
  /**
   * Load task list data
   * 
   * Execution flow:
   * 1. Set loading state to true
   * 2. Build request parameters (pagination info + filter conditions)
   * 3. Call taskService.getTaskList API
   * 4. Parse response data and update related states
   * 5. Handle success/failure cases and uniformly close loading state
   * 
   * @param {number} page - Target page number, defaults to current pagination info
   * @param {number} size - Number of items per page, defaults to current pagination setting
   * @returns {Promise<void>} Asynchronous operation, no return value
   * @throws {Error} Throws exception when network request fails or data parsing error occurs
   */
  const loadTasks = async (page: number = pagination.current, size: number = pagination.pageSize) => {
    setLoading(true);
    try {
      const response = await taskService.getTaskList({
        page,
        size,
        filters
      });
      
      if (response.success) {
        setTasks(response.data.tasks);
        setTotal(response.data.total);
        setPagination({
          current: page,
          pageSize: size,
          total: response.data.total
        });
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error('Failed to load task list');
      console.error('Failed to load task list:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Component initialization effect hook
   * Automatically load task list data on component first render
   * Empty dependency array ensures only executed once
   */
  useEffect(() => {
    loadTasks();
  }, []);

  // ==================== Search and Filter Layer ====================
  // Module Responsibility: Handle user search and filter operations, manage filter condition states
  // Data Flow: User input -> Filter condition update -> Reload data -> UI update
  // Key Logic: Reset pagination to first page when filter conditions change to ensure search result accuracy
  
  /**
   * Execute search operation
   * Called when user clicks search button or triggers search event
   * 
   * Execution flow:
   * 1. Reset pagination to first page (avoid search result pagination confusion)
   * 2. Reload data using current filters state
   * 
   * @returns {void} No return value, UI re-renders triggered by state update
   */
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current: 1 }));
    loadTasks(1, pagination.pageSize);
  };

  /**
   * Handle filter condition change
   * Called by SearchFilter component to synchronize filter condition state
   * 
   * @param {TaskFilters} newFilters - New filter conditions object
   * @returns {void} No return value, directly update filters state
   */
  const handleFiltersChange = (newFilters: TaskFilters) => {
    setFilters(newFilters);
  };

  // ==================== Task CRUD Operations Layer ====================
  // Module Responsibility: Handle task CRUD operations, manage form state
  // Data Flow: User operation -> API request -> State update -> UI refresh
  // Key Logic: Form state management, error handling, data synchronization after success
  
  /**
   * Handle create new task operation
   * Called by FloatingButton component to open create task form
   * 
   * Execution flow:
   * 1. Clear edit state (set to create mode)
   * 2. Display task form modal
   * 
   * @returns {void} No return value, control UI via state update
   */
  const handleNewTask = () => {
    setEditingTask(null);
    setTaskFormVisible(true);
  };

  /**
   * Handle task edit operation
   * Called by TaskList component to open edit form for specified task
   * 
   * Execution flow:
   * 1. Set currently editing task object
   * 2. Display task form modal (form will auto pre-fill data)
   * 
   * @param {Task} task - Task object to edit
   * @returns {void} No return value, control UI via state update
   */
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskFormVisible(true);
  };

  /**
   * Handle task form submit
   * Called by TaskForm component, executes create or update operation based on whether editingTask exists
   * 
   * Execution flow:
   * 1. Determine current operation type (create/edit)
   * 2. Call corresponding API interface
   * 3. Handle API response result
   * 4. Close form and refresh data after success
   * 5. Display error message on failure
   * 
   * @param {TaskFormData} formData - Form submitted task data
   * @returns {Promise<void>} Asynchronous operation, no return value
   * @throws {Error} Throws exception when API request fails or data validation error occurs
   */
  const handleTaskFormSubmit = async (formData: TaskFormData) => {
    try {
      let response;
      if (editingTask) {
        response = await taskService.updateTask(editingTask.id, formData);
        if (response.success) {
          message.success('Task updated successfully');
        }
      } else {
        response = await taskService.createTask(formData);
        if (response.success) {
          message.success('Task created successfully');
        }
      }
      
      if (response.success) {
        setTaskFormVisible(false);
        setEditingTask(null);
        loadTasks();
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error(editingTask ? 'Failed to update task' : 'Failed to create task');
      console.error('Task operation failed:', error);
    }
  };

  /**
   * Handle delete task operation
   * Called by TaskList component, displays confirmation dialog and handles delete operation
   * 
   * Execution flow:
   * 1. Display confirmation dialog to prevent misoperation
   * 2. Call delete API after user confirmation
   * 3. Handle API response result
   * 4. Refresh task list after success
   * 5. Display error message on failure
   * 
   * @param {string} taskId - Task ID to delete
   * @returns {void} No return value, user interaction handled by Modal component
   */
  const handleDeleteTask = (taskId: string) => {
    Modal.confirm({
      title: 'Confirm Delete',
      content: 'Are you sure you want to delete this task? This operation cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const response = await taskService.deleteTask(taskId);
          if (response.success) {
            message.success('Task deleted successfully');
            loadTasks();
          } else {
            message.error(response.message);
          }
        } catch (error) {
          message.error('Failed to delete task');
          console.error('Failed to delete task:', error);
        }
      }
    });
  };

  /**
   * Handle task status update
   * Called by TaskList component to quickly update task status
   * 
   * Execution flow:
   * 1. Call status update API
   * 2. Handle API response result
   * 3. Refresh task list after success
   * 4. Display error message on failure
   * 
   * @param {string} taskId - Task ID to update
   * @param {TaskStatus} status - New task status
   * @returns {Promise<void>} Asynchronous operation, no return value
   * @throws {Error} Throws exception when API request fails or status update error occurs
   */
  const handleTaskStatusChange = async (taskId: string, status: TaskStatus) => {
    try {
      const response = await taskService.updateTaskStatus(taskId, status);
      if (response.success) {
        message.success('Task status updated successfully');
        loadTasks();
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error('Failed to update task status');
      console.error('Failed to update task status:', error);
    }
  };

  // ==================== Batch Operations Layer ====================
  // Module Responsibility: Handle batch operations on multiple tasks, manage selection state
  // Data Flow: User selection -> Batch operation -> API request -> State clear -> Data refresh
  // Key Logic: Clear selection state after batch operation success to ensure operation consistency
  
  /**
   * Handle task selection state change
   * Called by TaskList component to synchronize selection state to parent component
   * 
   * @param {string[]} taskIds - Array of currently selected task IDs
   * @returns {void} No return value, directly update selectedTaskIds state
   */
  const handleTaskSelect = (taskIds: string[]) => {
    setSelectedTaskIds(taskIds);
  };

  /**
   * Handle batch operation routing dispatch
   * Called by TaskList component, dispatch to corresponding handler method based on operation type
   * 
   * @param {string} operation - Operation type ('delete' | 'updateStatus')
   * @param {string[]} taskIds - Array of task IDs to operate on
   * @returns {void} No return value, dispatch to corresponding handler function based on operation type
   */
  const handleBatchOperation = (operation: string, taskIds: string[]) => {
    if (operation === 'delete') {
      handleBatchDelete(taskIds);
    } else if (operation === 'updateStatus') {
      // Batch status update operation handled directly by FloatingButton component
    }
  };

  /**
   * Handle batch delete operation
   * Called by FloatingButton component to batch delete selected tasks
   * 
   * Execution flow:
   * 1. Call batch delete API
   * 2. Handle API response result
   * 3. Clear selection state and refresh data after success
   * 4. Display error message on failure
   * 
   * @param {string[]} taskIds - Array of task IDs to delete
   * @returns {Promise<void>} Asynchronous operation, no return value
   * @throws {Error} Throws exception when API request fails or batch delete error occurs
   */
  const handleBatchDelete = async (taskIds: string[]) => {
    try {
      const response = await taskService.batchDeleteTasks(taskIds);
      if (response.success) {
        message.success(response.message);
        setSelectedTaskIds([]);
        loadTasks();
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error('Failed to batch delete');
      console.error('Failed to batch delete:', error);
    }
  };

  /**
   * Handle batch status update operation
   * Called by FloatingButton component to batch update status of selected tasks
   * 
   * Execution flow:
   * 1. Call batch status update API
   * 2. Handle API response result
   * 3. Clear selection state and refresh data after success
   * 4. Display error message on failure
   * 
   * @param {string[]} taskIds - Array of task IDs to update
   * @param {TaskStatus} status - Target status
   * @returns {Promise<void>} Asynchronous operation, no return value
   * @throws {Error} Throws exception when API request fails or batch update error occurs
   */
  const handleBatchStatusUpdate = async (taskIds: string[], status: TaskStatus) => {
    try {
      const response = await taskService.batchUpdateTaskStatus(taskIds, status);
      if (response.success) {
        message.success(response.message);
        setSelectedTaskIds([]);
        loadTasks();
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error('Failed to batch update status');
      console.error('Failed to batch update status:', error);
    }
  };

  /**
   * Clear selection state
   * Called by FloatingButton component to clear all task selection state
   * 
   * @returns {void} No return value, directly clear selectedTaskIds state
   */
  const handleClearSelection = () => {
    setSelectedTaskIds([]);
  };

  // ==================== UI Interaction Handling Layer ====================
  // Module Responsibility: Handle UI interaction events between components, manage modal state
  // Data Flow: User interaction -> Event handling -> State update -> UI response
  // Key Logic: Uniformly manage modal show/hide and edit state reset
  
  /**
   * Handle task form cancel operation
   * Called by TaskForm component to close form modal and reset edit state
   * 
   * Execution flow:
   * 1. Close task form modal
   * 2. Clear edit task state (prevent data residue)
   * 
   * @returns {void} No return value, control UI via state update
   */
  const handleTaskFormCancel = () => {
    setTaskFormVisible(false);
    setEditingTask(null);
  };

  // ==================== Component Rendering Layer ====================
  // Module Responsibility: Organize and render all child components, build complete user interface
  // Data Flow: State data -> Component props -> Child component rendering -> User interface
  // Key Logic: Layout management, component integration, style application and responsive design
  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      {/* Page header area - Display system title and statistics */}
      <Header style={{ 
        background: '#fff',
        padding: '0 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        zIndex: 1000
      }}>
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '100%'
        }}>
          {/* System title */}
          <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
            Task Management System
          </Title>
          
          {/* Statistics display area */}
          <div style={{ color: '#666', fontSize: 14 }}>
            Total {total} task(s)
            {selectedTaskIds.length > 0 && (
              <span style={{ marginLeft: 16, color: '#1890ff' }}>
                Selected {selectedTaskIds.length}
              </span>
            )}
          </div>
        </div>
      </Header>
      
      {/* Main content area */}
      <Content style={{ padding: '24px', overflow: 'auto' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          {/* Search filter component - Provides multi-condition filter functionality */}
          <SearchFilter
            filters={filters}
            onFiltersChange={handleFiltersChange}
            availableAssignees={MOCK_ASSIGNEES}
            onSearch={handleSearch}
            loading={loading}
          />

          {/* Task list container */}
          <div style={{ 
            background: '#fff',
            borderRadius: 8,
            padding: 24,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            {/* Task list component - Display task data and individual operations */}
            <TaskList
              tasks={tasks}
              loading={loading}
              selectedTaskIds={selectedTaskIds}
              onTaskSelect={handleTaskSelect}
              onTaskEdit={handleEditTask}
              onTaskDelete={handleDeleteTask}
              onTaskStatusChange={handleTaskStatusChange}
              onBatchOperation={handleBatchOperation}
            />
          </div>
        </div>

        {/* Floating action button - Provides quick action entry */}
        <FloatingButton
          selectedTaskIds={selectedTaskIds}
          onNewTask={handleNewTask}
          onBatchDelete={handleBatchDelete}
          onBatchStatusUpdate={handleBatchStatusUpdate}
          onClearSelection={handleClearSelection}
        />

        {/* Task form modal - For creating and editing tasks */}
        <TaskForm
          visible={taskFormVisible}
          editingTask={editingTask}
          onCancel={handleTaskFormCancel}
          onSubmit={handleTaskFormSubmit}
          availableAssignees={MOCK_ASSIGNEES}
        />
      </Content>
    </Layout>
  );
};

export default TaskManager;