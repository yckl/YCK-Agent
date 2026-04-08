const fs = require('fs');
const path = 'C:\\\\Users\\\\YCK\\\\Desktop\\\\claude\\\\YCK-Agent\\\\src\\\\web\\\\public\\\\index.html';
let content = fs.readFileSync(path, 'utf8');

const anchor = "buffer += decoder.decode(value, { stream: true });";

// The corrupted part is right after anchor
const brokenPart = "const lines = buffer.split('\\nasync function navigateTo(page) {";

if (content.includes(brokenPart)) {
  const replaceStr = `buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\\n\\n');
          buffer = parts.pop() || '';
          for (const chunk of parts) {
            const line = chunk.trim();
            if (!line.startsWith('data: ')) continue;
            const dataStr = line.replace(/^data:\\s*/, '');
            if (dataStr === '[DONE]') break;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.type === 'text') {
                fullText += parsed.content;
                textEl.innerHTML = marked.parse(fullText);
                autoScroll();
              } else if (parsed.type === 'thinking') {
                if (mullingEl) {
                  mullingEl.innerHTML = '<span class="mulling-text">🤔 Thinking...</span>\\n' + marked.parse(parsed.content);
                }
              } else if (parsed.type === 'tool_start') {
                activeTools[parsed.name] = document.createElement('div');
                activeTools[parsed.name].className = 'tool-indicator';
                activeTools[parsed.name].innerHTML = '<span class="tool-name">🛠️ ' + parsed.name + '</span><span class="tool-status running">Running...</span>';
                toolsEl.appendChild(activeTools[parsed.name]);
                autoScroll();
              } else if (parsed.type === 'tool_end') {
                if (activeTools[parsed.name]) {
                  activeTools[parsed.name].querySelector('.tool-status').className = 'tool-status done';
                  activeTools[parsed.name].querySelector('.tool-status').textContent = 'Done';
                  if (parsed.args) {
                    const argStr = typeof parsed.args === 'string' ? parsed.args : JSON.stringify(parsed.args, null, 2);
                    const det = document.createElement('div');
                    det.className = 'tool-details';
                    det.innerHTML = '<pre><code>' + escapeHtml(argStr) + '</code></pre>';
                    activeTools[parsed.name].appendChild(det);
                  }
                }
              } else if (parsed.type === 'error') {
                 mullingEl?.remove();
                 hasError = true;
                 textEl.innerHTML += '<p style="color:#C96442">⚠️ Error: ' + parsed.error + '</p>';
                 autoScroll();
              }
            } catch(e) {
              console.error('Parse error', e, dataStr);
            }
          }
        }
      } catch (err) {
         if(!hasError) {
           textEl.innerHTML += '<p style="color:#C96442">⚠️ Request Failed</p>';
         }
      } finally {
        isStreaming = false;
        document.getElementById('sendBtn').innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';
        document.getElementById('sendBtn').disabled = false;
        mullingEl?.remove();
        try { Prism.highlightAllUnder(textEl); } catch(e){}
        // update history
      }
    }

    function escapeHtml(unsafe) {
      return (unsafe||'').toString()
           .replace(/&/g, "&amp;")
           .replace(/</g, "&lt;")
           .replace(/>/g, "&gt;")
           .replace(/"/g, "&quot;")
           .replace(/'/g, "&#039;");
    }

    function autoScroll() {
       const c = document.getElementById('messagesContainer');
       if(c) c.scrollTop = c.scrollHeight;
    }

    function appendMessage(role, text, images) {
      const msgs = document.getElementById('messages');
      const msgEl = document.createElement('div');
      msgEl.className = 'msg msg-' + role;
      let inner = '';
      if(role === 'assistant') {
        inner = '<div class="msg-avatar"><svg viewBox="0 0 24 24"><path d="M12 2v20M2 12h20M5 5l14 14M5 19L19 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></div>' +
                '<div class="msg-bubble">' + marked.parse(text) + '</div>';
      } else {
        inner = '<div class="msg-bubble">' + escapeHtml(text) + '</div>';
      }
      msgEl.innerHTML = inner;
      msgs.appendChild(msgEl);
      autoScroll();
    }

    function appendAssistantMsg() {
      const msgs = document.getElementById('messages');
      const msgEl = document.createElement('div');
      msgEl.className = 'msg msg-assistant messageIn';
      
      const avatar = document.createElement('div');
      avatar.className = 'msg-avatar';
      avatar.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 2v20M2 12h20M5 5l14 14M5 19L19 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
      
      const bubble = document.createElement('div');
      bubble.className = 'msg-bubble';
      
      const mullingEl = document.createElement('div');
      mullingEl.className = 'thinking-inner';
      mullingEl.innerHTML = '<span class="mulling-text">🤔 Thinking...</span>';
      
      const toolsEl = document.createElement('div');
      const textEl = document.createElement('div');
      
      bubble.appendChild(mullingEl);
      bubble.appendChild(toolsEl);
      bubble.appendChild(textEl);
      
      msgEl.appendChild(avatar);
      msgEl.appendChild(bubble);
      msgs.appendChild(msgEl);
      autoScroll();
      
      return { bubbleEl: bubble, mullingEl, toolsEl, textEl };
    }

    // Keyboard listener properly added
    document.addEventListener('DOMContentLoaded', () => {
      const input = document.getElementById('chatInput');
      if(input) {
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
          }
        });
      }
    });

    async function navigateTo(page) {`;
  
  content = content.replace(brokenPart, replaceStr);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Fixed index.html successfully!');
} else {
  console.log('Broken part not found. Maybe Already fixed?');
}
