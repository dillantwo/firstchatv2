import { checkAdminPermission } from '../../../../../middleware/adminAuth.js';
import AdminPermission from '../../../../../models/AdminPermission.js';

// PUT - Update admin permission
export async function PUT(request, { params }) {
  try {
    const req = {
      headers: { authorization: request.headers.get('authorization') },
      body: await request.json(),
      params
    };
    
    let res = {
      status: (code) => ({
        json: (data) => new Response(JSON.stringify(data), { status: code })
      })
    };

    let middlewareExecuted = false;
    const next = () => { middlewareExecuted = true; };

    await checkAdminPermission('permission_edit')(req, res, next);
    if (!middlewareExecuted) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { id } = params;
    const updates = req.body;

    const adminPermission = await AdminPermission.findByIdAndUpdate(
      id,
      {
        ...updates,
        lastModifiedBy: req.user._id.toString(),
        updatedAt: Date.now()
      },
      { new: true }
    );

    if (!adminPermission) {
      return Response.json(
        { error: 'Admin permission not found' },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      permission: adminPermission
    });

  } catch (error) {
    console.error('Error updating admin permission:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete admin permission
export async function DELETE(request, { params }) {
  try {
    const req = {
      headers: { authorization: request.headers.get('authorization') },
      params
    };
    
    let res = {
      status: (code) => ({
        json: (data) => new Response(JSON.stringify(data), { status: code })
      })
    };

    let middlewareExecuted = false;
    const next = () => { middlewareExecuted = true; };

    await checkAdminPermission('permission_delete')(req, res, next);
    if (!middlewareExecuted) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { id } = params;

    const adminPermission = await AdminPermission.findByIdAndUpdate(
      id,
      {
        isActive: false,
        lastModifiedBy: req.user._id.toString(),
        updatedAt: Date.now()
      },
      { new: true }
    );

    if (!adminPermission) {
      return Response.json(
        { error: 'Admin permission not found' },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      message: 'Admin permission deactivated successfully'
    });

  } catch (error) {
    console.error('Error deleting admin permission:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
