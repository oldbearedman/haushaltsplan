import React from 'react';
import TaskItem from './TaskItem';
import styled from 'styled-components';
console.log("▶ TaskList render, tasks =", tasks);

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: ${({ theme }) => theme.spacing(2)};
`;

export default function TaskList({ tasks, onToggleComplete }) {
  return (
    <Grid>
      {tasks.map(task => (
        <TaskItem
          key={task.id}
          task={task}
          onToggleComplete={onToggleComplete}
        />
      ))}
    </Grid>
  );
}
