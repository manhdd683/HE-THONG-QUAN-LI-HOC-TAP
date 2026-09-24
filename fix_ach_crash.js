const fs = require('fs');

function fixFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace: try { metrics = JSON.parse(ach.metrics); } catch (e) {}
  // With: try { if (ach.metrics) metrics = { ...metrics, ...JSON.parse(ach.metrics) }; } catch (e) {}
  
  content = content.replace(
    /try\s*{\s*metrics\s*=\s*JSON\.parse\(ach\.metrics\);\s*}\s*catch\s*\(e\)\s*{}/g,
    'try { if (ach.metrics) metrics = { ...metrics, ...JSON.parse(ach.metrics) }; } catch (e) {}'
  );
  
  fs.writeFileSync(file, content);
  console.log('Fixed', file);
}

fixFile('client/src/pages/Achievements/ParentAchievements.tsx');
fixFile('client/src/pages/Achievements/AchievementManagement.tsx');
