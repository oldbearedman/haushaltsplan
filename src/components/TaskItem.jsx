import React from 'react';
import { Card } from './Card';
import styled from 'styled-components';
import { FaBroom, FaUtensils, FaTshirt, FaToilet, FaHandsWash } from 'react-icons/fa';

const Title = styled.h6`
  ${({ theme }) => theme.typography.h6};
  margin: 0 0 ${({ theme }) => theme.spacing(1)};
`;

const Body = styled.p`
  ${({ theme }) => theme.typography.body1};
  margin: 0 0 ${({ theme }) => theme.spacing(2)};
`;

const Button = styled.button`
  background: ${({ theme, grey }) =>
    grey ? theme.palette.secondary : theme.palette.primary};
  color: white;
  border: none;
  border-radius: 4px;
  padding: ${({ theme }) => theme.spacing(1)} ${({ theme }) => theme.spacing(2)};
  cursor: pointer;
  &:hover {
    opacity: 0.9;
  }
`;

const IconWrapper = styled.span`
  margin-right: ${({ theme }) => theme.spacing(1)};
  vertical-align: middle;
`;

const getIcon = name => {
  const lower = name.toLowerCase();
  if (lower.includes('tisch')) return <FaUtensils />;
  if (lower.includes('wäsche')) return <FaTshirt />;
  if (lower.includes('boden')) return <FaBroom />;
  if (lower.includes('toilette') || lower.includes('bad')) return <FaToilet />;
  if (lower.includes('hände')) return <FaHandsWash />;
  return <FaBroom />;
};

export default function TaskItem({ task, onToggleComplete }) {
  const isDone = !!task.doneBy;
  return (
    <Card>
      <Title>
        <IconWrapper>{getIcon(task.name)}</IconWrapper>
        {task.name}
      </Title>
      <Body>
        {isDone
          ? `Erledigt von ${task.doneBy}`
          : `Punkte: ${task.points}`}
      </Body>
      <Button onClick={() => onToggleComplete(task.id)} grey={isDone}>
        {isDone ? 'Rückgängig' : `🪙 +${task.points}`}
      </Button>
    </Card>
  );
}
