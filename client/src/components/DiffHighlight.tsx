// 文本差异高亮显示组件
import { DiffResult } from '../types';

interface DiffHighlightProps {
  diffs: DiffResult[];
  showCorrect?: boolean;
}

export default function DiffHighlight({ diffs, showCorrect = true }: DiffHighlightProps) {
  return (
    <div className="leading-loose">
      {diffs.map((diff, index) => {
        if (diff.type === 'correct' && !showCorrect) {
          return <span key={index}>{diff.text}</span>;
        }
        
        if (diff.type === 'correct') {
          return <span key={index} className="text-gray-900">{diff.text}</span>;
        }
        
        if (diff.type === 'missing') {
          return (
            <span
              key={index}
              className="bg-green-100 text-green-700 border-b-2 border-green-400"
              title="遗漏的内容"
            >
              {diff.text}
            </span>
          );
        }
        
        if (diff.type === 'extra') {
          return (
            <span
              key={index}
              className="bg-red-100 text-red-700 line-through"
              title="多余的内容"
            >
              {diff.text}
            </span>
          );
        }
        
        if (diff.type === 'wrong') {
          return (
            <span
              key={index}
              className="bg-yellow-100 text-yellow-700 border-b-2 border-yellow-400"
              title="错误的内容"
            >
              {diff.text}
            </span>
          );
        }
        
        return <span key={index}>{diff.text}</span>;
      })}
    </div>
  );
}
