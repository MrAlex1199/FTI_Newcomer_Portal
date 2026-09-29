import { describe, it, expect } from 'vitest';
import { getEmployeeTier } from '../../components/organization/OrganizationChart.jsx';

describe('getEmployeeTier', () => {
  it('identifies root nodes as executive tier', () => {
    const node = { id: 'root1', fullName: 'Top Executive', position: 'Leader' };
    expect(getEmployeeTier(node, true)).toBe('executive');
  });

  it('identifies executive keywords in position', () => {
    expect(getEmployeeTier({ position: 'Chief Executive Officer' }, false)).toBe('executive');
    expect(getEmployeeTier({ position: 'Managing Director (MD)' }, false)).toBe('executive');
    expect(getEmployeeTier({ position: 'President & CEO' }, false)).toBe('executive');
    expect(getEmployeeTier({ position: 'เลขาธิการสภาอุตสาหกรรม' }, false)).toBe('executive');
    expect(getEmployeeTier({ position: 'รองเลขาธิการ' }, false)).toBe('executive');
  });

  it('identifies managers with subordinates or manager titles', () => {
    expect(getEmployeeTier({ position: 'IT Manager', children: [] }, false)).toBe('manager');
    expect(getEmployeeTier({ position: 'Senior Engineer', children: [{ id: 'child1' }] }, false)).toBe('manager');
    expect(getEmployeeTier({ position: 'ผู้อำนวยการฝ่ายการเงิน' }, false)).toBe('manager');
    expect(getEmployeeTier({ position: 'หัวหน้าส่วนงาน' }, false)).toBe('manager');
  });

  it('defaults individual contributors without children to staff', () => {
    expect(getEmployeeTier({ position: 'Software Engineer', children: [] }, false)).toBe('staff');
    expect(getEmployeeTier({ position: 'HR Officer', children: [] }, false)).toBe('staff');
    expect(getEmployeeTier(null, false)).toBe('staff');
  });
});
