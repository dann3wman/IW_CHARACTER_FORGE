import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { CharacterSkills } from '../types';

interface SkillChartProps {
  skills: CharacterSkills;
}

const SkillChart: React.FC<SkillChartProps> = ({ skills }) => {
  const data = Object.keys(skills).map(key => ({
    subject: key,
    A: skills[key] || 0,
    fullMark: 5, // Updated max value to 5
  }));

  return (
    <div className="w-full h-64 md:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#4b5563" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#d1d5db', fontSize: 10 }} 
          />
          <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
          <Radar
            name="Skills"
            dataKey="A"
            stroke="#8b5cf6"
            strokeWidth={2}
            fill="#8b5cf6"
            fillOpacity={0.4}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SkillChart;