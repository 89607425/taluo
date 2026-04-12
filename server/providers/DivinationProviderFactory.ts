import { DivinationProvider, ProviderType } from './DivinationProvider';
import { LiuyaoProvider } from './LiuyaoProvider';
import { TarotProvider } from './TarotProvider';

export function createProvider(type: ProviderType): DivinationProvider {
  switch (type) {
    case 'liuyao':
      return new LiuyaoProvider();
    case 'tarot':
      return new TarotProvider();
    default:
      throw new Error(`Unsupported provider type: ${type}`);
  }
}
