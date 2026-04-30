<?php

namespace App\Policies;

use App\Models\Space;
use App\Models\User;

class SpacePolicy
{
    /**
     * Public spaces are visible to everyone. Private spaces require an
     * authenticated org member (any role) or a global admin.
     */
    public function view(?User $user, Space $space): bool
    {
        if ($space->visibility !== 'private') {
            return true;
        }

        return $user !== null && $this->isMember($user, $space);
    }

    /**
     * Managing a space requires a global admin or an org member with
     * a role that can edit (owner / admin / editor).
     */
    public function manage(User $user, Space $space): bool
    {
        return $user->is_admin || $this->isMember($user, $space, ['owner', 'admin', 'editor']);
    }

    private function isMember(User $user, Space $space, array $roles = []): bool
    {
        $query = $user->organizations()->where('organizations.id', $space->organization_id);

        if ($roles) {
            $query->wherePivotIn('role', $roles);
        }

        return $query->exists();
    }
}
