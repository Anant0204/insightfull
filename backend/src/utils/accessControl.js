const prisma = require('../config/db');

/**
 * Central authorization check for accessing another employee's data.
 * - Agent tokens may only access their own employee record.
 * - JWT users may access their own data; ADMIN/MANAGER may access
 *   employees within the same organization only.
 * Roles are always re-read from the DB so stale tokens cannot escalate.
 *
 * @param {Object} req - Express request (requires req.user from auth middleware)
 * @param {string} targetEmployeeId - Employee whose data is being accessed
 * @returns {Promise<boolean>}
 */
const canAccessEmployeeData = async (req, targetEmployeeId) => {
    const requester = req.user || {};
    if (!targetEmployeeId) return false;

    if (requester.role === 'AGENT') {
        return requester.employeeId === targetEmployeeId;
    }

    let requesterEmployeeId = requester.employeeId;
    if (!requesterEmployeeId && requester.userId) {
        const user = await prisma.user.findUnique({
            where: { id: requester.userId },
            select: { employeeId: true }
        });
        requesterEmployeeId = user?.employeeId;
    }
    if (!requesterEmployeeId) return false;
    if (requesterEmployeeId === targetEmployeeId) return true;

    const [requesterEmp, targetEmp] = await Promise.all([
        prisma.employee.findUnique({
            where: { id: requesterEmployeeId },
            select: { role: true, organizationId: true }
        }),
        prisma.employee.findUnique({
            where: { id: targetEmployeeId },
            select: { organizationId: true }
        })
    ]);

    if (!requesterEmp || !targetEmp) return false;
    if (!targetEmp.organizationId || targetEmp.organizationId !== requesterEmp.organizationId) return false;

    return requesterEmp.role === 'ADMIN' || requesterEmp.role === 'MANAGER';
};

module.exports = { canAccessEmployeeData };
