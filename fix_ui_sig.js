const fs = require('fs');
const file = 'client/src/pages/Reports/ReportsPage.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `            <div className="pr-footer">
              <div className="pr-signature-area">
                <p>Ngày ...... tháng ...... năm 2026</p>
                <p><strong>XÁC NHẬN CỦA GIÁO VIÊN</strong></p>
                <div className="pr-signature-space"></div>
                <p>{user?.name || 'Gia sư'}</p>
              </div>
            </div>`;

content = content.replace(target, '');
fs.writeFileSync(file, content);
console.log('Removed signature footer');
