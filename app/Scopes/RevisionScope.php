<?php
namespace App\Scopes;

use Illuminate\Database\Eloquent\Scope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
/**
 * Created by IntelliJ IDEA.
 * User: bug
 * Date: 28.01.19
 * Time: 18:02
 */
class RevisionScope implements Scope
{
    public function apply(Builder $builder, Model $model)
    {
        $builder->where('revision', env('revision', 'default'));
    }
}
