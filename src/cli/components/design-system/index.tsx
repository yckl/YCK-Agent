import React, { useState } from 'react';
import { Box, Text } from 'ink';

export const Divider = ({ color }: { color?: string }) => {
  const [width, setWidth] = useState(process.stdout.columns || 80);
  
  React.useEffect(() => {
    const onResize = () => setWidth(process.stdout.columns || 80);
    process.stdout.on('resize', onResize);
    return () => { process.stdout.off('resize', onResize); };
  }, []);

  return (
    <Text color={color || 'cyan'} wrap="truncate">
      {'─'.repeat(Math.max(1, width))}
    </Text>
  );
};

export const Pane = ({ children, color }: { children?: React.ReactNode, color?: string }) => {
  return (
    <Box flexDirection="column" paddingTop={1}>
      <Divider color={color} />
      <Box flexDirection="column" paddingX={2}>
        {children}
      </Box>
    </Box>
  );
};

export const Tabs = ({ title, children, color, defaultTab }: any) => {
  const tabs = React.Children.toArray(children) as React.ReactElement[];
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.props.id);

  return (
    <Box flexDirection="column">
      <Box flexDirection="row" gap={1}>
        {title && <Text bold color={color || 'cyan'}>{title}</Text>}
        {tabs.map((child, i) => {
          const id = child.props.id;
          const isCurrent = activeTab === id;
          return (
            <Box key={id} paddingX={1} backgroundColor={isCurrent ? (color || 'cyan') : undefined}>
              <Text
                color={isCurrent ? 'black' : undefined}
                bold={isCurrent}
              >
                {child.props.title}
              </Text>
            </Box>
          );
        })}
      </Box>
      <Box marginTop={1}>
        {tabs.find(child => child.props.id === activeTab)}
      </Box>
    </Box>
  );
};

export const Tab = ({ id, title, children }: any) => {
  return <Box flexDirection="column">{children}</Box>;
};

export const Dialog = ({ title, subtitle, children, inputGuide, color }: any) => {
  return (
    <Pane color={color}>
      <Box flexDirection="column" gap={1}>
        <Box flexDirection="column">
          <Text bold color={color || 'cyan'}>{title}</Text>
          {subtitle && <Text color="gray">{subtitle}</Text>}
        </Box>
        <Box flexDirection="column">
          {children}
        </Box>
      </Box>
      {inputGuide && (
        <Box marginTop={1}>
          <Text color="gray" italic>{inputGuide}</Text>
        </Box>
      )}
    </Pane>
  );
};
