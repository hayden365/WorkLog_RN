import { useWorkplaceStore } from '../../src/store/workplaceStore';
import { Workplace } from '../../src/models/Workplace';

const wp = (o: Partial<Workplace> = {}): Workplace => ({
  id: 'wp1',
  name: '카페',
  color: '#3D5AFE',
  wageType: 'hourly',
  wage: 10000,
  defaultBreakMinutes: 0,
  archived: false,
  ...o,
});

describe('useWorkplaceStore', () => {
  beforeEach(() => {
    useWorkplaceStore.setState({ workplacesById: {} });
  });

  it('근무지를 추가하고 id로 조회한다', () => {
    useWorkplaceStore.getState().addWorkplace(wp());
    expect(useWorkplaceStore.getState().getWorkplaceById('wp1')?.name).toBe('카페');
  });

  it('근무지를 수정한다', () => {
    useWorkplaceStore.getState().addWorkplace(wp());
    useWorkplaceStore.getState().updateWorkplace('wp1', { wage: 12000 });
    expect(useWorkplaceStore.getState().getWorkplaceById('wp1')?.wage).toBe(12000);
  });

  it('보관 처리하면 archived=true가 되고 활성 목록에서 빠진다', () => {
    useWorkplaceStore.getState().addWorkplace(wp());
    useWorkplaceStore.getState().addWorkplace(wp({ id: 'wp2', name: '편의점' }));
    useWorkplaceStore.getState().archiveWorkplace('wp1');
    expect(useWorkplaceStore.getState().getWorkplaceById('wp1')?.archived).toBe(true);
    const active = useWorkplaceStore.getState().getActiveWorkplaces();
    expect(active.map((w) => w.id)).toEqual(['wp2']);
  });
});
