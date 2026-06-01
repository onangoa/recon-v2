'use client';

import { useEffect, useState } from 'react';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  project: {
    name: string;
  };
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch('/api/tasks');
        const data = await res.json();
        setTasks(data);
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-destructive bg-destructive/10';
      case 'medium':
        return 'text-amber-600 bg-amber-500/10';
      case 'low':
        return 'text-blue-600 bg-blue-500/10';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-600';
      case 'in-progress':
        return 'bg-blue-500/10 text-blue-600';
      case 'pending':
        return 'bg-amber-500/10 text-amber-600';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Tasks</h2>
          <p className="mt-2 text-muted-foreground">
            Manage all tasks across your projects
          </p>
        </div>
        <button className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90">
          + New Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <button className="rounded-md border border-primary bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          All
        </button>
        <button className="rounded-md border border-border px-3 py-1 text-sm font-medium hover:bg-secondary/30">
          In Progress
        </button>
        <button className="rounded-md border border-border px-3 py-1 text-sm font-medium hover:bg-secondary/30">
          Completed
        </button>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {loading ? (
          <p className="text-muted-foreground">Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p className="text-muted-foreground">No tasks found</p>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{task.title}</h3>
                  <p className="text-xs text-muted-foreground">{task.project.name}</p>
                  {task.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <span className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                  <span className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${getStatusColor(task.status)}`}>
                    {task.status}
                  </span>
                </div>
              </div>
              {task.dueDate && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
