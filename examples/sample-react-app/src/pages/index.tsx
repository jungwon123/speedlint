import moment from 'moment';
import { Chart } from 'chart.js';
import { Button, Card } from '../components';

export default function() {
  const now = moment().format('YYYY-MM-DD');

  window.addEventListener('scroll', () => {
    console.log('scrolled');
  });

  return (
    <div>
      <img src="/hero.jpg" loading="lazy" alt="Hero" />
      <h1>Welcome - {now}</h1>
      <Card title="Product" image="/product.jpg" />
      <Button>Click me</Button>
    </div>
  );
}
