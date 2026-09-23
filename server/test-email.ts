import { sendHomeworkNotification } from './src/utils/mailer';

async function test() {
  await sendHomeworkNotification(
    'phuhuynh@example.com',
    'Nguyễn Văn Test',
    'Toán học - Ôn tập Phương trình bậc 2',
    new Date()
  );
  console.log('Test email sent!');
}

test();
