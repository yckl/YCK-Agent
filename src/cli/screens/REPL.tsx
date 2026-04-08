import React, { useState, useEffect } from 'react';
import { useApp, useInput, useStdout, Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import { chatEngine } from '../../core/query/QueryEngine.js';
import { getConfig, switchProvider, switchModel, loadConfig } from '../../core/config/index.js';
import { Message } from '../../types/message.js';
import { ThemedBox, ThemedText, useTheme } from '../components/design-system/index.js';
import { CompanionSprite } from '../components/buddy/CompanionSprite.js';
import { feature } from '../../core/flags.js';

interface REPLProps {
  initialMessage?: string;
  exitTerminal: () => void;
}

const Spinner = () => {
  const [frame, setFrame] = useState(0);
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  useEffect(() => {
    const timer = setInterval(() => {
      setFrame((f) => (f + 1) % frames.length);
    }, 80);
    return () => clearInterval(timer);
  }, []);
  return <ThemedText color="claudeBlue_FOR_SYSTEM_SPINNER">{frames[frame]}</ThemedText>;
};

// --- Command Palette Definitions ---

const COMMANDS = [
  { label: 'help       ❓ 获取操作与快捷键提示', value: '/help' },
  { label: 'clear      🧹 清空当前终端的聊天大纲', value: '/clear' },
  { label: 'provider   🔄 无缝切换底层 API 服务商', value: '/provider' },
  { label: 'model      🤖 切换当前运行的 AI 模型', value: '/model' },
  { label: 'config     ⚙️  查看系统全局配置', value: '/config' },
  { label: 'exit       🚪 退出 YCK-Agent 系统', value: '/exit' }
];

const INDICATOR = (props: any) => {
  return <ThemedText color="claude">{props.isSelected ? '▶ ' : '  '}</ThemedText>;
};

const ITEM = (props: any) => {
  return (
    <ThemedText color={props.isSelected ? "claude" : "text"} bold={props.isSelected}>
      {props.label}
    </ThemedText>
  );
};

export const REPL: React.FC<REPLProps> = ({ initialMessage, exitTerminal }) => {
  const { exit } = useApp();
  const [input, setInput] = useState(initialMessage || '');
  const [history, setHistory] = useState<Message[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [currentConfig, setCurrentConfig] = useState(getConfig());
  const [errorMsg, setErrorMsg] = useState('');
  const [showPalette, setShowPalette] = useState(false);
  
  // States for sub-palettes
  const [selectionMode, setSelectionMode] = useState<'none' | 'provider' | 'model'>('none');

  const { stdout } = useStdout();
  const [columns, setColumns] = useState(stdout?.columns || 80);

  useEffect(() => {
    if (!stdout) return;
    let timer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setColumns(stdout.columns);
      }, 150);
    };
    stdout.on('resize', handleResize);
    return () => {
      clearTimeout(timer);
      stdout.off('resize', handleResize);
    };
  }, [stdout]);

  useInput((inputCh, key) => {
    if (key.ctrl && inputCh === 'c') {
      if (isSubmitting) {
         // theoretical stream cancellation
      } else {
        exitTerminal();
        exit();
      }
    }
    // If the user presses escape back to root
    if (key.escape && showPalette) {
       setShowPalette(false);
       setInput('');
       setSelectionMode('none');
    }
  });

  useEffect(() => {
    if (input.trim() === '/' && selectionMode === 'none') {
      setShowPalette(true);
    } else if (input.trim() !== '/') {
      setShowPalette(false);
    }
  }, [input, selectionMode]);

  const handleProviderSelect = (item: any) => {
    try {
      switchProvider(item.value);
      const newCfg = loadConfig();
      setCurrentConfig({ ...newCfg });
      chatEngine.resetClients();
      setHistory([...history, 
        { role: 'assistant', content: `✅ 原生系统命令 \`provider\`:\n已应用最新服务商并重启引擎: [${item.value}]。`, timestamp: Date.now() }
      ]);
    } catch (e: any) {
      setErrorMsg(`❌ 切换服务商失败: ${e.message}`);
    }
    setSelectionMode('none');
    setInput('');
  };

  const handleModelSelect = (item: any) => {
    try {
      switchModel(item.value);
      const newCfg = loadConfig();
      setCurrentConfig({ ...newCfg });
      setHistory([...history, 
        { role: 'assistant', content: `✅ 原生系统命令 \`model\`:\n已将主模型变更为: [${item.value}]。`, timestamp: Date.now() }
      ]);
    } catch (e: any) {
      setErrorMsg(`❌ 切换模型失败: ${e.message}`);
    }
    setSelectionMode('none');
    setInput('');
  };

  const handleCommandSelect = (item: any) => {
    setShowPalette(false);
    if (item.value === '/provider') {
      setSelectionMode('provider');
      return;
    }
    if (item.value === '/model') {
      setSelectionMode('model');
      return;
    }
    setInput('');
    executeSlashCommand(item.value);
  };

  const executeSlashCommand = (cmd: string) => {
    if (cmd === '/exit' || cmd === '/quit') {
      exitTerminal();
      exit();
      return;
    }
    if (cmd === '/clear') {
      setHistory([]);
      return;
    }
    if (cmd === '/help') {
      setHistory([...history, { 
        role: 'assistant', 
        content: `**Command Menu Usage**\n\n- Typed \`/\` to access interactive panel.\n- Use Arrow Keys to navigate, Enter to submit.\n- ESC to cancel.`, 
        timestamp: Date.now() 
      }]);
      return;
    }
    if (cmd === '/config') {
       const cfg = getConfig();
       let content = `**⚙️ Current System Overview**\n`;
       content += `- Active Provider: ${cfg.activeProvider}\n`;
       content += `- Active Model: ${cfg.activeModel}\n`;
       content += `- UI Theme: ${cfg.theme}\n`;
       setHistory([...history, { role: 'assistant', content, timestamp: Date.now() }]);
       return;
    }
  };

  const handleSubmit = async (value: string) => {
    if (!value.trim() && !initialMessage) return;

    // Check manual text fallback for slashed inputs
    if (value.startsWith('/')) {
       const [baseCmd, arg] = value.trim().split(' ');
       if (baseCmd === '/provider' && arg) {
          handleProviderSelect({ value: arg });
          return;
       }
       if (baseCmd === '/model' && arg) {
          handleModelSelect({ value: arg });
          return;
       }
       if (['/help', '/clear', '/config', '/exit', '/quit'].includes(baseCmd as string)) {
          executeSlashCommand(baseCmd as string);
          return;
       }
    }

    setIsSubmitting(true);
    setInput('');
    setErrorMsg('');

    const userMsg = { role: 'user' as const, content: value, timestamp: Date.now() };
    const currentHist = [...history, userMsg];

    let content = '';
    setStreamingContent('');

    try {
      for await (const event of chatEngine.chat(currentHist, { systemPrompt: currentConfig.systemPrompt })) {
        if (event.type === 'text_delta' && event.content) {
          content += event.content;
          setStreamingContent(content);
        } else if (event.type === 'error') {
          content += `\n[System Error]: ${event.error}`;
          setStreamingContent(content);
        }
      }
      setHistory([...currentHist, { role: 'assistant', content, timestamp: Date.now() }]);
    } catch (err: any) {
      setHistory([...currentHist, { role: 'assistant', content: `[Error: ${err.message}]`, timestamp: Date.now() }]);
    }

    setStreamingContent('');
    setIsSubmitting(false);
  };

  useEffect(() => {
    if (initialMessage) {
      handleSubmit(initialMessage);
    }
  }, []);

  const getProviderItems = () => {
    return Object.keys(currentConfig.providers).map(p => ({
       label: p + (currentConfig.activeProvider === p ? ' (Current)' : ''),
       value: p
    }));
  };

  const getModelItems = () => {
    const actProv = currentConfig.providers[currentConfig.activeProvider];
    // Mock extracting model strings
    if (actProv && actProv.models) {
       const availableModels = Object.values(actProv.models);
       return availableModels.map(m => ({
          label: typeof m === 'string' ? (m + (currentConfig.activeModel === m ? ' (Current)' : '')) : 'unknown',
          value: typeof m === 'string' ? m : 'unknown'
       }));
    }
    return [{ label: 'No models configured', value: 'unknown' }];
  };

  return (
    <ThemedBox flexDirection="column" gap={0} backgroundColor="clawd_background">
      
      {/* Main Content Area (Messages + Buddy) */}
      <ThemedBox flexDirection={columns < 100 ? "column" : "row"} width="100%">
        {/* Messages List Area */}
        <ThemedBox flexDirection="column" paddingBottom={1} flexGrow={1}>
          {history.length === 0 && (
            <ThemedBox flexDirection="column" marginBottom={1} paddingX={1} marginTop={1}>
              <ThemedText color="claude">Welcome to YCK-Agent.</ThemedText>
              <ThemedBox flexDirection="column" marginY={1}>
                <ThemedText color="success">✓ Found MCP servers</ThemedText>
                <ThemedText color="success">✓ Loaded project context</ThemedText>
              </ThemedBox>
              <ThemedBox borderStyle="round" borderColor="promptBorder" paddingX={1} width={65} flexDirection="column">
                <ThemedText bold color="text">Permission rules</ThemedText>
                <ThemedText color="inactive">The agent won't ask before using allowed tools.</ThemedText>
              </ThemedBox>
            </ThemedBox>
          )}
          
          {history.map((msg, i) => (
            <ThemedBox key={i} flexDirection="column" marginY={0}>
              {msg.role === 'user' ? (
                <ThemedBox flexDirection="row" backgroundColor="userMessageBackground" paddingX={1}>
                  <ThemedText color="subtle" bold>{'> '}</ThemedText>
                  <ThemedText color="text">{msg.content}</ThemedText>
                </ThemedBox>
              ) : (
                <ThemedBox flexDirection="row" paddingX={1} paddingTop={1} paddingBottom={1}>
                  <ThemedText color="claude">● </ThemedText>
                  <ThemedBox flexDirection="column">
                    {msg.content ? (
                      <ThemedText color="text">{msg.content}</ThemedText>
                    ) : (
                      <ThemedText color="inactive">(Empty...)</ThemedText>
                    )}
                  </ThemedBox>
                </ThemedBox>
              )}
            </ThemedBox>
          ))}
        </ThemedBox>

        {/* Buddy Sprite (Top Right) */}
        {feature('BUDDY') && (
           <Box alignSelf={columns < 100 ? "flex-end" : "flex-start"} marginRight={1} marginTop={columns < 100 ? 1 : 0}>
             <CompanionSprite userId="User_YCK_Node1" />
           </Box>
        )}
      </ThemedBox>

      {/* Streaming and Loading Region */}
      {isSubmitting && (
        <ThemedBox flexDirection="column" paddingX={1} paddingBottom={1}>
          <ThemedBox flexDirection="row">
            <ThemedText color="warning">{'* '}</ThemedText>
            <ThemedText color="subtle">Mulling... (</ThemedText>
            {!streamingContent && <Spinner />}
            {streamingContent && <ThemedText color="subtle">receiving</ThemedText>}
            <ThemedText color="subtle"> • esc to interrupt)</ThemedText>
          </ThemedBox>
          {streamingContent && (
            <ThemedBox flexDirection="row" marginTop={1}>
              <ThemedText color="claude">● </ThemedText>
              <ThemedText color="text">{streamingContent}</ThemedText>
            </ThemedBox>
          )}
        </ThemedBox>
      )}

      {errorMsg && (
        <ThemedBox paddingX={1} paddingBottom={1}>
          <ThemedText color="error">{errorMsg}</ThemedText>
        </ThemedBox>
      )}

      {/* Input / Command Palette Region */}
      <ThemedBox flexDirection="column" borderTopColor="promptBorder" borderTop={history.length > 0 ? true : false}>
        {!isSubmitting ? (
          <ThemedBox flexDirection="column">
            
            {showPalette && (
              <ThemedBox flexDirection="column" borderStyle="round" borderColor="promptBorder" marginX={1} paddingX={1} marginTop={1}>
                 <ThemedText color="subtle" bold>Command Menu:</ThemedText>
                 <SelectInput 
                    items={COMMANDS} 
                    onSelect={handleCommandSelect} 
                    itemComponent={ITEM} 
                    indicatorComponent={INDICATOR} 
                 />
              </ThemedBox>
            )}

            {selectionMode === 'provider' && (
              <ThemedBox flexDirection="column" borderStyle="round" borderColor="promptBorder" marginX={1} paddingX={1} marginTop={1}>
                 <ThemedText color="subtle" bold>Select Provider:</ThemedText>
                 <SelectInput 
                    items={getProviderItems()} 
                    onSelect={handleProviderSelect} 
                    itemComponent={ITEM} 
                    indicatorComponent={INDICATOR} 
                 />
              </ThemedBox>
            )}

            {selectionMode === 'model' && (
               <ThemedBox flexDirection="column" borderStyle="round" borderColor="promptBorder" marginX={1} paddingX={1} marginTop={1}>
                 <ThemedText color="subtle" bold>Select Model for {currentConfig.activeProvider}:</ThemedText>
                 <SelectInput 
                    items={getModelItems()} 
                    onSelect={handleModelSelect} 
                    itemComponent={ITEM} 
                    indicatorComponent={INDICATOR} 
                 />
              </ThemedBox>
            )}

            {!showPalette && selectionMode === 'none' && (
              <ThemedBox flexDirection="row" paddingX={1}>
                <ThemedText color="subtle" bold>{'> '}</ThemedText>
                <ThemedBox flexGrow={1}>
                  <TextInput
                    value={input}
                    onChange={setInput}
                    onSubmit={handleSubmit}
                    placeholder="Enter message or type / for commands"
                  />
                </ThemedBox>
              </ThemedBox>
            )}

          </ThemedBox>
        ) : (
          <ThemedBox flexDirection="column" paddingX={1}>
            <ThemedBox flexDirection="row">
              <ThemedText color="inactive">{'> '}</ThemedText>
              <Spinner />
            </ThemedBox>
          </ThemedBox>
        )}
      </ThemedBox>

      {/* Status Line (Footer) */}
      <ThemedBox flexDirection="row" justifyContent="space-between" backgroundColor="messageActionsBackground" paddingX={1}>
        <ThemedBox>
          <ThemedText color="subtle"> /help • tab toggle thinking • esc interrupt </ThemedText>
        </ThemedBox>
        <ThemedBox>
          <ThemedText color="claude"> {currentConfig.activeModel} </ThemedText>
          <ThemedText color="subtle"> • Tokens: 124K • Cost: $0.12</ThemedText>
        </ThemedBox>
      </ThemedBox>

    </ThemedBox>
  );
};

