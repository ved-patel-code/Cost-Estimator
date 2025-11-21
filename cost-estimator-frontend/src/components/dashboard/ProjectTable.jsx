import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Calendar } from 'lucide-react';

const ProjectTable = ({ projects }) => {
  const navigate = useNavigate();

  if (!projects || projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg border border-gray-200 border-dashed">
        <FolderOpen size={48} className="text-gray-300 mb-3" />
        <p className="text-gray-500 font-medium">No projects found.</p>
        <p className="text-gray-400 text-sm">Create a new project to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Company
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Project Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Address
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {projects.map((project) => (
              <tr 
                key={project.id} 
                onClick={() => navigate(`/project/${project.id}`)}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                {/* Company Name - Truncated */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 max-w-[150px] truncate" title={project.company_name}>
                    {project.company_name || "—"}
                  </div>
                </td>

                {/* Project Name - Truncated */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 font-medium max-w-[200px] truncate" title={project.project_name}>
                    {project.project_name}
                  </div>
                  <div className="text-xs text-gray-500">Rev: {project.revision}</div>
                </td>

                {/* Address - Truncated */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500 max-w-[250px] truncate" title={project.project_address}>
                    {project.project_address || "—"}
                  </div>
                </td>

                {/* Date */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} />
                    {project.project_date}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProjectTable;