/***************************  MENU ITEMS - SUPPORT  ***************************/

const other = {
  id: 'group-support',
  title: 'Support',
  icon: 'IconLifebuoy',
  type: 'group',
  children: [
    { id: 'support', title: 'Help & Support', type: 'item', url: '/support', icon: 'IconLifebuoy' },
    { id: 'changelog', title: "What's New", type: 'item', url: '/changelog', icon: 'IconHistory' },
    { id: 'documentation', title: 'Documentation', type: 'item', url: 'https://jdproductions.io/capabilities.html', target: true, icon: 'IconNotes' }
  ]
};

export default other;
