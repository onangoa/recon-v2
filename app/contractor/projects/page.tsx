'use client';

import { useEffect, useState } from 'react';

interface Project {
  id: string;
  name: string;
  location: string;
  status: string;
  budget: number;
  spent: number;
  startDate: string;
  endDate?: string;
}

export default function ContractorProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch('/api/projects');
        const data = await res.json();
        setProjects(data);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-600 border-green-200';
      case 'completed':
        return 'bg-blue-500/10 text-blue-600 border-blue-200';
      case 'paused':
        return 'bg-amber-500/10 text-amber-600 border-amber-200';
      default:
        return 'bg-primary/10 text-primary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">My Projects</h2>
          <p className="mt-2 text-muted-foreground">
            View and manage all your construction projects
          </p>
        </div>
        <button className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90">
          + New Project
        </button>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">No projects found</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="rounded-lg border border-border bg-card p-6 hover:shadow-lg transition-shadow"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground">{project.name}</h3>
                  <p className="text-sm text-muted-foreground">{project.location}</p>
                </div>
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium border ${getStatusColor(project.status)}`}>
                  {project.status}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Budget</p>
                  <p className="font-medium text-foreground">
                    KES {project.budget.toLocaleString()}
                  </p>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Budget Used</p>
                    <p className="text-xs font-medium text-foreground">
                      {((project.spent / project.budget) * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div className="h-2 rounded-full bg-secondary">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${Math.min((project.spent / project.budget) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setSelectedProject(project)}
                    className="flex-1 rounded-md bg-primary/10 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/20"
                  >
                    View Details
                  </button>
                  <button className="flex-1 rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-secondary/30">
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Project Details Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-96 w-full max-w-2xl overflow-auto rounded-lg bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-foreground">
                {selectedProject.name}
              </h3>
              <button
                onClick={() => setSelectedProject(null)}
                className="text-2xl text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium text-foreground">{selectedProject.location}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium text-foreground">{selectedProject.status}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Budget</p>
                  <p className="font-medium text-foreground">
                    KES {selectedProject.budget.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount Spent</p>
                  <p className="font-medium text-foreground">
                    KES {selectedProject.spent.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium text-foreground">
                    {new Date(selectedProject.startDate).toLocaleDateString()}
                  </p>
                </div>
                {selectedProject.endDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">End Date</p>
                    <p className="font-medium text-foreground">
                      {new Date(selectedProject.endDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <button className="flex-1 rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90">
                  Edit Project
                </button>
                <button className="flex-1 rounded-md border border-border px-4 py-2 font-medium hover:bg-secondary/30">
                  View Tasks
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
